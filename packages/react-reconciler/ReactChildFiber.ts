import { ReactNode, ReactNodeChild, ReactNodeChildren } from "../react/interface";
import { REACT_ELEMENT_TYPE } from "../shared/ReactSymbols";
import { isArray, isObject, isRawChildren } from "../shared/utils";
import { createFiberFromElement, createFiberFromText, FiberNode } from "./ReactFiber";

const reconcileSingleElement = (returnFiber: FiberNode, newChild: ReactNode) => {
  const created = createFiberFromElement(newChild);
  created.return = returnFiber;
  return created;
}

const reconcileSingleTextNode = (returnFiber: FiberNode, newChild: string) => {
  const created = createFiberFromText(newChild);
  created.return = returnFiber;
  return created;
}

const reconcileChildrenObject = (returnFiber: FiberNode, newChild: ReactNode) => {
  switch (newChild.$$typeof) {
    case REACT_ELEMENT_TYPE:
      return reconcileSingleElement(
        returnFiber,
        newChild,
      );
    default:
      return null;
  }
}

const createChild = (returnFiber: FiberNode, child: ReactNodeChild) => {
  if (isObject(child)) {
    return reconcileChildrenObject(returnFiber, child as ReactNode)
  } else if (isRawChildren(child)) {
    return reconcileSingleTextNode(returnFiber, child as string)
  }

  return null;
}

/**
 * 数组的 fiber 有 sibling 的关系链
 */
const reconcileChildrenArray = (returnFiber: FiberNode, newChildren: ReactNodeChild[]) => {
  let first: FiberNode | null = null;
  let prev: FiberNode | null = null;
  for(let i = 0; i < newChildren.length; i++) {
    const newFiber = createChild(returnFiber, newChildren[i]);
    if (prev) {
      prev.sibling = newFiber;
    }
    if (!first) {
      first = newFiber;
    }
    prev = newFiber;
  }

  return first;
}

const ChildReconciler = (shouldTrackSideEffects: boolean) => {
  const reconcileChildFibers = (returnFiber: FiberNode, newChild: ReactNodeChildren) => {
    if (isObject(newChild)) {
      return reconcileChildrenObject(returnFiber, newChild as ReactNode)
    } else if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, newChild as ReactNodeChild[])
    } else if (isRawChildren(newChild)) {
      return reconcileSingleTextNode(returnFiber, newChild as string)
    }
    return null;
  }
  return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

