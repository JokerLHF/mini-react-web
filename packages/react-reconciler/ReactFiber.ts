import { ReactNode, ReactNodeKey, ReactNodeProps } from "../react/interface";
import { ReactFiberMemoizedState, ReactFiberStateNode, ReactFiberTag, ReactFiberType, ReactFiberUpdateQueue } from "./interface";

export class FiberNode {
  tag: ReactFiberTag;
  key: ReactNodeKey;
  pendingProps: ReactNodeProps;
  type: ReactFiberType | null;
  stateNode: ReactFiberStateNode | null;

  return: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  alternate: FiberNode | null;

  memoizedState: ReactFiberMemoizedState;
  updateQueue: ReactFiberUpdateQueue | null;

  constructor(tag: ReactFiberTag, pendingProps: ReactNodeProps = {}, key: ReactNodeKey = null) {

    /**
     * 作为静态数据
     */
    this.tag = tag;
    this.pendingProps = pendingProps;
    this.key = key;
    this.type = null;
    this.stateNode = null;

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
  }
}

export const createWorkInProgress = (current: FiberNode, pendingProps: ReactNodeProps) => {
  let workInProgress = current.alternate;

  // mount 阶段，return child sibling 这些关系在 reconcileChildFibers 会确定
  if (!workInProgress) {
    workInProgress = new FiberNode(current.tag, pendingProps, current.key);

    workInProgress.updateQueue = current.updateQueue;
    workInProgress.memoizedState = current.memoizedState;

    current.alternate = workInProgress;
    workInProgress.alternate = current;

    workInProgress.stateNode = current.stateNode;
  } else {
    // update 阶段

  }

  return workInProgress;
}

export const createFiberFromElement = (element: ReactNode) => {
  const { type, key, props } = element;
  const fiber = new FiberNode(ReactFiberTag.HostComponent, props, key);
  fiber.type = type;
  return fiber;
}

export const createFiberFromText = (textContent: string) => {
  // TODO: 这里为了保持 props 都是对象，textContent 包裹在 props 里
  const fiber = new FiberNode(ReactFiberTag.HostText, { _reactTextContent: textContent });
  return fiber;
}