import { ReactNodeProps } from "../react/interface"
import ReactCurrentDispatcher from "../react/ReactCurrentDispatcher"
import { FunctionComponent } from "./interface/fiber"
import { Dispatch, Dispatcher, Hook, Update, UpdateQueue } from "./interface/hook"
import { FiberNode } from "./ReactFiber"
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"

// 当前函数组件的 workInprogress fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前函数组件正在执行的 hook
let workInProgressHook: Hook | null = null;

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

const mountState = <S>(initialState: S): [S, Dispatch<S>] => {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  hook.queue = {
    pending: null,
  };
  const dispatch: Dispatch<S> = dispatchAction.bind(null, currentlyRenderingFiber as FiberNode, hook.queue);
  return [hook.memoizedState, dispatch];
}

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: mountState,
}

const HooksDispatcherOnMount = {
  useState: mountState,
}

export const renderWithHooks = (current: FiberNode | null, workInProgress: FiberNode, ComponentFunc: FunctionComponent, props: ReactNodeProps) => {
  currentlyRenderingFiber = workInProgress;
  // 重置
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  // 通过 current区分是否是首次渲染，对应不同hook
  ReactCurrentDispatcher.current = current ? HooksDispatcherOnUpdate : HooksDispatcherOnMount;
  // 渲染函数组件
  const children = ComponentFunc(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}