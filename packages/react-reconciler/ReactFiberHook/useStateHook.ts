import { mountWorkInProgressHook, getCurrentlyRenderingFiber, getCurrentHook, updateWorkInProgressHook } from "./index";
import { BasicStateAction, Dispatch, Hook, ReactHookReducer, Update, UpdateQueue } from "../interface/hook";
import { FiberNode } from "../ReactFiber";
import { scheduleUpdateOnFiber } from "../ReactFiberWorkLoop";
import { markWorkInProgressReceivedUpdate } from "../ReactFiberBeginWork";


export const dispatchAction = <A>(fiber: FiberNode, queue: UpdateQueue<A>, action: A) => {
  const update: Update<A> = {
    action,
    next: null,
  };

  /** 这里的逻辑跟 fiberUpdate 一样
   * 1. 插入 u0, 当前pending: u0
   *   - u0 -
   *   |____|  
   * 
   * 2. 插入 u1, 当前pending: u1
   *   u0 - u1
   *   |_____|
   * 
   * 3. 插入 u2, 当前pending: u2
   *   u0 - u1 - u2
   *   |__________| 
   * 
   * 4. 插入 u3, 当前pending: u3
   *   u0 - u1 - u2 - u3
   *   |_______________| 
   */

  const pendingQueue = queue.pending;
  if (!pendingQueue) {
    // 自己成环
    update.next = update;
  } else {
    update.next = pendingQueue.next;
    pendingQueue.next = update;
  }
  queue.pending = update;

  // 走更新流程
  scheduleUpdateOnFiber(fiber);
}

export const mountState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  hook.queue = {
    pending: null,
    dispatch: null,
  };

  const dispatch: Dispatch<BasicStateAction<S>> 
    = hook.queue.dispatch
    = dispatchAction.bind(null, getCurrentlyRenderingFiber() as FiberNode, hook.queue);
  return [hook.memoizedState, dispatch];
}

/**
 * 在 mount 阶段 useState 返回 dispatch，调用 dispatch 会往 updateQueue 增加记录，随后重新走 scheduleUpdateOnFiber
 * 此时再执行到这里已经是 update 阶段，需要执行 updateQueue 的获取最新的 state 
 */
 const updateReducer = <S, A>(
  reducer: ReactHookReducer<S>,
): [S, Dispatch<BasicStateAction<S>>] => {
  const hook = updateWorkInProgressHook() as Hook;
  const queue = hook.queue!;
  let baseQueue: Update<any> | null = null;

  if (queue.pending) {
    baseQueue = queue.pending;
    queue.pending = null;
  }

  if (baseQueue) {
    let newState = getCurrentHook()?.memoizedState;
    // baseQueue 是一个环形链表，越往有的update时间越完，此时的 baseQueue.next 就是一个进来的 update
    let first = baseQueue.next;
    let update = first;

    do {
      const action = (update as Update<any>).action;
      newState = reducer(newState, action);
      update = (update as Update<any>).next;
    } while(update && update !== first);

    /**
     * 执行 updateQueue 得到的 update 与原来的 state 值做对比判断是否需要更新。
     * 做这一步的目的是优化，因为有可能多次 setState 的值相同，根本不需要更新：
     *    const [state, setState] = useState(1);
     *    setState(1)
     *    setState(1)
     */
    if (!Object.is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }
  
    hook.memoizedState = newState;
  }

  const dispatch = queue.dispatch!;
  return [hook.memoizedState, dispatch];
}

// 传给useState的第二个参数，可以接受 值 或 回调函数 作为参数
const basicStateReducer = <S>(state: S, action: BasicStateAction<S>) => {
  return typeof action === 'function' ? action(state) : action;
}

export const updateState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  return updateReducer(basicStateReducer)
}
