import { ReactNode, ReactNodeKey, ReactNodeProps } from "../react/interface";
import { ReactFiberMemoizedState, ReactFiberSideEffectTags, ReactFiberStateNode, ReactFiberTag, ReactFiberType, ReactFiberUpdateQueue } from "./interface/fiber";

export class FiberNode {
  tag: ReactFiberTag;
  key: ReactNodeKey;
  pendingProps: ReactNodeProps;
  type: ReactFiberType;
  stateNode: ReactFiberStateNode;

  return: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  alternate: FiberNode | null;

  memoizedState: ReactFiberMemoizedState;
  updateQueue: ReactFiberUpdateQueue;

  effectTag: ReactFiberSideEffectTags;
  firstEffect: FiberNode | null;
  lastEffect: FiberNode | null;
  nextEffect: FiberNode | null;
  index: number;

  constructor(tag: ReactFiberTag, pendingProps: ReactNodeProps = {}, key: ReactNodeKey = null) {

    /**
     * 作为静态数据
     */
    this.tag = tag;
    this.pendingProps = pendingProps;
    this.type = null;
    this.stateNode = null;

    // diff 默认使用用户定义的 key, 没有使用 index
    this.index = 0;
    this.key = key;

    /**
     *  用于连接其他Fiber节点形成Fiber树
     */
    // 指向父Fiber
    this.return = null;
    // 指向子Fiber
    this.child = null;
    // 指向兄弟Fiber
    this.sibling = null;
    // 指向前一次render的fiber
    this.alternate = null;

    /**
     * 动态数据
     */
    this.memoizedState = null;
    this.updateQueue = null;
    this.effectTag = ReactFiberSideEffectTags.NoEffect;

    // 以下3个变量组成了当前Fiber上保存的effect list
    this.firstEffect = null;
    this.lastEffect = null;
    this.nextEffect = null;
  }
}

export const cloneChildFibers = (workInProgress: FiberNode) => {
  let currentChild = workInProgress.child;
  if (!currentChild) {
    return;
  }

  // clone 第一个 child
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;
  newChild.return = workInProgress;

  // 遍历 clone 兄弟节点
  while(currentChild.sibling) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
    newChild.return = workInProgress;
  }

  // TODO：这个是干什么用的？  newChild.sibling = null;
}


// 为 current fiber 创建对应的 alternate fiber
export const createWorkInProgress = (current: FiberNode, pendingProps: ReactNodeProps) => {
  let workInProgress = current.alternate;

  if (!workInProgress) {
    workInProgress = new FiberNode(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    current.alternate = workInProgress;
    workInProgress.alternate = current;
  } else {
    // reactRoot 此时就存在 workInprogress。所以还是需要对 child sibling 赋值
    workInProgress.pendingProps = pendingProps;
    // 已有alternate的情况重置effect
    workInProgress.effectTag = ReactFiberSideEffectTags.NoEffect;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
    workInProgress.nextEffect = null;
  }

  workInProgress.child = current.child;
  workInProgress.sibling = current.sibling;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.memoizedState = current.memoizedState;
  return workInProgress;
}

export const createFiberFromElement = (element: ReactNode) => {
  const { type, key, props } = element;
  const tag = typeof type === 'function' ? ReactFiberTag.FunctionComponent : ReactFiberTag.HostComponent;
  const fiber = new FiberNode(tag, props, key);
  fiber.type = type;
  return fiber;
}

export const createFiberFromText = (textContent: string) => {
  /**
   * TIPS: 这里为了保持 props 都是对象，比较容易处理，所以 textContent 包裹在 props 里
   * 但是 React 不是，ReactFiber props 可能是对象也有可能是文本字符串。（感觉react的处理增加了复杂度🤔🤔🤔）
   */
  const fiber = new FiberNode(ReactFiberTag.HostText, { _reactTextContent: textContent });
  return fiber;
}