import { mountWorkInProgressHook, getCurrentlyRenderingFiber, getCurrentHook, updateWorkInProgressHook } from "./index";
import { BasicStateAction, Dispatch, Hook, ReactHookReducer, Update, UpdateQueue } from "../interface/hook";
import { FiberNode } from "../ReactFiber";
import { scheduleUpdateOnFiber } from "../ReactFiberWorkLoop";
import { getRenderExpirationTime } from "../ReactFiberWorkLoop/const";
import { computeExpirationForFiber, requestCurrentTimeForUpdate } from "../ReactFiberExpirationTime/updateExpirationTime";
import { setWorkInProgressDidUpdate } from "../ReactFiberBeginWork/const";

/**
 * 这里因为要拿到 hook.memoizedState，所以这里将 hook 传进来。
 * react 做法是只传入 queue，但是 queue 没有办法拿到 hook 的数据
 * 所以 react 在 queue 设置一个 lastReducerState 值跟 hook.memoizedState 一样。在赋值 hook.memoizedState 的时候也赋值给 lastReducerState
 */
export const dispatchAction = <A>(fiber: FiberNode, hook: Hook, action: A) => {
  const currentTime = requestCurrentTimeForUpdate();
  var expirationTime = computeExpirationForFiber(currentTime);

  const update: Update<A> = {
    action,
    next: null,
    expirationTime,
  };
  const queue = hook.queue!;
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

  const lastRenderedReducer = queue.lastRenderedReducer;
  if (lastRenderedReducer) {
    const currentState = hook.memoizedState;
    const newState = lastRenderedReducer(currentState, action as any);
    if (Object.is(currentState, newState)) {
      return;
    }
  }
  // 走更新流程
  scheduleUpdateOnFiber(fiber, expirationTime);
}

export const mountState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
  };

  /**
   * 有一道常见面试题来自这里
   *  const [state, setState] = useState();
   *  window.setState = setState;
   * 我在控制台输入 window.setState() UI 会不会变化
   * 答案是会的，因为这里提前注入了 fiber 等变量，也就是说 setState 运行不需要上下文
   */
  const dispatch: Dispatch<BasicStateAction<S>> 
    = hook.queue.dispatch
    = dispatchAction.bind(null, getCurrentlyRenderingFiber() as FiberNode, hook);
  return [hook.memoizedState, dispatch];
}

/**
 * 在 mount 阶段 useState 返回 dispatch，调用 dispatch 会往 updateQueue 增加记录，随后重新走 scheduleUpdateOnFiber
 * 此时再执行到这里已经是 update 阶段，需要执行 updateQueue 的获取最新的 state 
 */
const updateReducer = <S, A>(
  reducer: ReactHookReducer<S>,
): [S, Dispatch<BasicStateAction<S>>] => {
  const workInprogressFiber = getCurrentlyRenderingFiber()!;
  const hook = updateWorkInProgressHook() as Hook;
  const updateQueue = hook.queue!;

  updateQueue.lastRenderedReducer = reducer;
  const pendingQueue = updateQueue.pending;
  let baseQueue = hook.baseQueue;
  if (pendingQueue) {
    // 1. 将 pendingUpdate 拼入 baseUpdate 组成新的环形链表
    if (baseQueue) {
      // pendingQueue 尾巴接上 baseQueue 的头部     
      const baseFirst = baseQueue.next;
      pendingQueue.next = baseFirst;
      // baseQueue 尾巴接上 pendingQueue 的头部     
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
    }
    hook.baseQueue = baseQueue = pendingQueue;
    updateQueue.pending = null;
  }

  if (baseQueue) {
    /**
     * newState 是对应 fiber 的值：是通过执行 update 列表中属于本次优先级的 update 得到的结果
     * baseState 是对应 hook 的值：是遇到第一个优先级不足的 update 之前的 update 的结果值
     * 因为 update 存在优先级, 一些低优先级会被跳过：
     * 为了用户尽快可以看到结果所以有了 newState，但是为了保证 update 的执行顺序有了 baseState
     * https://segmentfault.com/a/1190000039008910
     */
    let newState = getCurrentHook()?.baseState;
    let newBaseState = null;

    /**
     * 保存新的优先级不足的 update 列表
     */
    let newBaseQueueFirst: Update<any> | null = null;
    let newBaseQueueLast: Update<any> | null = null;

    // baseQueue 是一个环形链表，越往有的update时间越完，此时的 baseQueue.next 就是一个进来的 update
    let first = baseQueue.next!;
    let update: Update<any> | null = first;

    do {
      const updateExpirationTime = update.expirationTime;
      // 优先级不足
      if (updateExpirationTime < getRenderExpirationTime()) {
        const clone = {
          next: null,
          action: update.action,
          expirationTime: updateExpirationTime,
        }

        // 拼接新的 baseQueue
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = (newBaseQueueLast  as Update<any>).next = clone;
        } 

        // 拿到优先级最高的 expirationTime
        if (updateExpirationTime > workInprogressFiber.expirationTime) {
          workInprogressFiber.expirationTime = updateExpirationTime;
        }
      } else {
        if (newBaseQueueLast) {
          /**
           * 进到这个判断说明现在处理的这个update在优先级不足的update之后，
           * 原因有二：
           * 第一，优先级足够；
           * 第二，newLastBaseState不为null说明已经有优先级不足的update了
           * 然后将这个高优先级放入本次的baseUpdate，实现之前提到的从updateQueue中
           * 截取低优先级update到最后一个update
           */
           const clone = {
            next: null,
            action: update.action,
            expirationTime: updateExpirationTime,
          };
          newBaseQueueLast = (newBaseQueueLast  as Update<any>).next = clone;
        }
        const action = (update as Update<any>).action;
        newState = reducer(newState, action);
      }

      update = update.next;
    } while(update && update !== first);

    // 等于 null 就代表没有低优先级的 update
    // 不等于 null 带有有低优先级，需要将 baseQueue 变为环形链表
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }

    /**
     * 执行 updateQueue 得到的 update 与原来的 state 值做对比判断是否需要更新。
     * 做这一步的目的是优化，因为有可能多次 setState 的值相同，根本不需要更新：
     *    const [state, setState] = useState(1);
     *    setState(1)
     *    setState(1)
     */
    if (!Object.is(newState, hook.memoizedState)) {
      setWorkInProgressDidUpdate(true);
    }
  
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
  }

  const dispatch = updateQueue.dispatch!;
  return [hook.memoizedState, dispatch];
}

// 传给useState的第二个参数，可以接受 值 或 回调函数 作为参数
const basicStateReducer = <S>(state: S, action: BasicStateAction<S>) => {
  return typeof action === 'function' ? action(state) : action;
}

export const updateState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  return updateReducer(basicStateReducer)
}
