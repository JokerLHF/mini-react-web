import { cloneChildFibers, FiberNode } from "../ReactFiber";

export const bailoutOnAlreadyFinishedWork = (workInProgress: FiberNode) => {
  cloneChildFibers(workInProgress);
  return workInProgress.child;
}