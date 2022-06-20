import { ReactNodeChildren } from "../../react/interface";
import { FunctionComponent, ReactFiberTag } from "../interface/fiber";
import { mountChildFibers, reconcileChildFibers } from "../ReactChildFiber";
import { FiberNode } from "../ReactFiber";
import { renderWithHooks } from "../ReactFiberHook";
import { processUpdateQueue } from "../ReactUpdateQueue";

const reconcileChildren = (current: FiberNode | null, workInProgress: FiberNode, nextChildren: ReactNodeChildren) => {
  // mount 阶段只有 root 节点存在 current
  // update 阶段就要看是否存在子节点
  if (current) {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  } else {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  }
}

const updateHostRoot = (current: FiberNode, workInProgress: FiberNode) => {
  processUpdateQueue(workInProgress);

  const nextState = workInProgress.memoizedState as Record<string, any>;
  const nextChildren = nextState.element;

  const prevState = current.memoizedState;
  const prevChildren = prevState ? (prevState as Record<string, any>).element : null;
  /**
   * TODO：这是一条优化路径
   */
  if (prevChildren === nextChildren) {
    // 当前root state未变化，走优化路径，不需要协调子节点
  }

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}


const updateHostComponent = (current: FiberNode | null, workInProgress: FiberNode) => {
  const nextProps = workInProgress.pendingProps;

  // 排除掉 null 和 textContent 情况，hostComponent 的 props 只能是对象
  if (!nextProps || typeof nextProps === 'string') {
    console.warn('updateHostComponent error happen');
    return null;
  }

  let nextChildren = nextProps.children;

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 对于 FunctionComponent fiber 来说，需要执行获取 children
 */
const updateFunctionComponent = (current: FiberNode | null, workInProgress: FiberNode) => {
  const { pendingProps, type } = workInProgress;

  // 排除掉 null 和 textContent 情况，functionComponent 的 props 只能是对象
  if (!pendingProps || typeof pendingProps === 'string') {
    console.warn('updateFunctionComponent error happen');
    return null;
  }

  const children = renderWithHooks(current, workInProgress, type as FunctionComponent, pendingProps);
  if (!children) {
    return null;
  }
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

/**
 * beginWork 的任务就是将 workInprogress 的子节点变为 fiber 节点。
 */
export const beginWork = (current: FiberNode | null, workInProgress: FiberNode): FiberNode | null => {
  // update时，可以复用current（即上一次更新的Fiber节点）
  if (current) {
    // TODO：优化路径
  }
  // mount时：根据tag不同，创建不同的子Fiber节点
  switch (workInProgress.tag) {
    case ReactFiberTag.HostRoot:
      // hostRoot 的 current 肯定存在
      return updateHostRoot(current!, workInProgress);
    case ReactFiberTag.HostComponent:
      return updateHostComponent(current, workInProgress);
    case ReactFiberTag.FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ReactFiberTag.HostText: // 文本节点不可能有子节点，直接返回null
    default:
      return null;
  }
}