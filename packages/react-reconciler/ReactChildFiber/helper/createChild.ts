import { ReactNode, ReactNodeChild } from "../../../react/interface";
import { REACT_ELEMENT_TYPE } from "../../../shared/ReactSymbols";
import { isObject, isText } from "../../../shared/utils";
import { createFiberFromElement, createFiberFromText, FiberNode } from "../../ReactFiber";

export const createChild = (returnFiber: FiberNode, newChild: ReactNodeChild) => {
  if (isObject(newChild)) {
    return createElementFiber(returnFiber, newChild as ReactNode);
  } else if (isText(newChild)) {
    const created = createFiberFromText(newChild as string);
    created.return = returnFiber;
    return created;
  }
  return null;
}

/**
 * 根据 object 类型创建对应的 fiber
 */
 export const createElementFiber = (returnFiber: FiberNode, newChild: ReactNode) => {
  switch(newChild.$$typeof) {
    case REACT_ELEMENT_TYPE:
      const created = createFiberFromElement(newChild);
      created.return = returnFiber;
      return created;
    default:
      return null;
  }
}
