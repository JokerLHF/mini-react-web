import { ReactNode, ReactNodeChildren } from "../react/interface";
import { ReactFiberTag } from "./interface";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { FiberNode } from "./ReactFiber";
import { processUpdateQueue } from "./ReactUpdateQueue";


const reconcileChildren = (current: FiberNode | null, workInProgress: FiberNode, nextChildren: ReactNodeChildren) => {
  // 首次渲染时只有 root 节点存在 current
  if (current) {
    workInProgress.child = reconcileChildFibers(workInProgress, nextChildren);
  } else {
    workInProgress.child = mountChildFibers(workInProgress, nextChildren);
  }
}

const updateHostRoot = (current: FiberNode, workInProgress: FiberNode) => {
  processUpdateQueue(workInProgress);

  const nextState = workInProgress.memoizedState!;
  const nextChildren = nextState.element as ReactNode;

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}


const updateHostComponent = (current: FiberNode | null, workInProgress: FiberNode) => {
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

export const beginWork = (current: FiberNode | null, workInProgress: FiberNode): FiberNode | null => {
  switch (workInProgress.tag) {
    case ReactFiberTag.HostRoot:
      // hostRoot 的 current 肯定存在
      return updateHostRoot(current!, workInProgress);
    case ReactFiberTag.HostComponent:
      return updateHostComponent(current, workInProgress);
    default:
      return null;
  }
}