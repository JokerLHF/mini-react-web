import { ReactNodeProps } from "../react/interface"
import { ReactCurrentDispatcher } from "../react/ReactHook"
import { FunctionComponent } from "./interface/fiber"
import { BasicStateAction, Dispatch, Dispatcher, Hook, ReactHookReducer, Update, UpdateQueue } from "./interface/hook"
import { FiberNode } from "./ReactFiber"
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"

// 当前函数组件的 workInprogress fiber
let currentlyRenderingFiber: FiberNode | null = null;
// workInProgressHook 属于 workInprogress fiber 当前执行的 fiber
let workInProgressHook: Hook | null = null;
// currentHook 属于 current fiber 当前执行的 fiber
let currentHook: Hook | null = null;

const mountWorkInProgressHook = () => {
  // 注意每个hook（useState/useEffect/useRef...都会有个对应的hook对象）
  const hook: Hook = {
    // mount时的初始化state
    memoizedState: null,
    queue: null,
    // 指向同一个FunctionComponent中下一个hook，构成链表
    next: null
  };
  
  if (!workInProgressHook) {
    // 这是list中第一个hook
    (currentlyRenderingFiber as FiberNode).memoizedState = workInProgressHook = hook;
  } else {
    // 将该hook append到list最后
    workInProgressHook.next = hook;
    // workInProgressHook 往后移动
    workInProgressHook = workInProgressHook.next;
  }
  return workInProgressHook;
}

const dispatchAction = <A>(fiber: FiberNode, queue: UpdateQueue<A>, action: A) => {
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

const mountState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  hook.queue = {
    pending: null,
    dispatch: null,
  };

  const dispatch: Dispatch<BasicStateAction<S>> 
    = hook.queue.dispatch
    = dispatchAction.bind(null, currentlyRenderingFiber as FiberNode, hook.queue);
  return [hook.memoizedState, dispatch];
}

// 这里的逻辑可以看这里：https://innos.io/space/68003907-707c-b0e6-50b1-f81e4aa54f63?p=fe0e2ad1-d19f-16d4-ae24-f8a44353e2e4_9a2c1bc0-1562-47d2-8ed8-8140592d21e4
const updateWorkInProgressHook = () => {
  // current fiber
  let nextCurrentHook: Hook | null = null;
  if (!currentHook) {
    const current = (currentlyRenderingFiber as FiberNode).alternate;
    nextCurrentHook = current ? current.memoizedState as Hook : null;
  } else {
    nextCurrentHook = currentHook.next;
  }

  // workInprogress fiber
  let nextWorkInProgressHook: Hook | null = null;
  if (!workInProgressHook) {
    nextWorkInProgressHook = null;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook) {
    // 这里好像永远不会进来，不知道这个逻辑是干什么的。先不写
  } else {
    // nextCurrentHook 已经结束了但是 workInProgressHook 还存在，证明前后两次 render hook 不一致
    if (nextCurrentHook === null) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    // 从 current hook复制来
    currentHook = nextCurrentHook;
    const newHook = {
      memoizedState: currentHook.memoizedState,
      queue: currentHook.queue,
      next: null
    };
    if (!workInProgressHook) {
      // 这是链表中第一个hook
      (currentlyRenderingFiber as FiberNode).memoizedState = workInProgressHook = newHook;
    } else {
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }

  return workInProgressHook;
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
    let newState = currentHook?.memoizedState;
    // baseQueue 是一个环形链表，越往有的update时间越完，此时的 baseQueue.next 就是一个进来的 update
    let first = baseQueue.next;
    let update = first;

    do {
      const action = (update as Update<any>).action;
      newState = reducer(newState, action);
      update = (update as Update<any>).next;
    } while(update && update !== first);

    hook.memoizedState = newState;
  }

  const dispatch = queue.dispatch!;
  
  return [hook.memoizedState, dispatch];
}

// 传给useState的第二个参数，可以接受 值 或 回调函数 作为参数
const basicStateReducer = <S>(state: S, action: BasicStateAction<S>) => {
  return typeof action === 'function' ? action(state) : action;
}

const updateState = <S>(initialState: S): [S, Dispatch<BasicStateAction<S>>] => {
  return updateReducer(basicStateReducer)
}

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
}

export const renderWithHooks = (current: FiberNode | null, workInProgress: FiberNode, ComponentFunc: FunctionComponent, props: ReactNodeProps) => {
  currentlyRenderingFiber = workInProgress;
  // 重置数据：update时 重新复制 hook， mount 新建 hook
  workInProgress.memoizedState = null;

  // 通过 current区分是否是首次渲染，对应不同hook
  ReactCurrentDispatcher.current = current ? HooksDispatcherOnUpdate : HooksDispatcherOnMount;
  // 渲染函数组件
  const children = ComponentFunc(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;

  return children;
}