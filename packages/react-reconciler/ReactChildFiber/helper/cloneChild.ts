import { ReactFiberProps } from "../../interface/fiber";
import { createWorkInProgress, FiberNode } from "../../ReactFiber";

/**
 * - 克隆 fiber, 并且得到的 fiber 是其父节点的唯一子节点。比如：
 * - oldFiber1 => oldFiber2 => oldFiber3  
 * - newElement
 * - 在 diff 过程中 oldFiber2 可以被复用作为 newElement，所以需要重置 sibling 以及 index
 */
export const useFiberAsSingle = (fiber: FiberNode, pendingProps: ReactFiberProps) => {
  const cloneFiber = createWorkInProgress(fiber, pendingProps);
  cloneFiber.sibling = null;
  cloneFiber.index = 0;
  return cloneFiber;
}