import { ReactElement, ReactNode } from "@mini/react";
import { REACT_ELEMENT_TYPE, isObject, isText } from "@mini/shared";
import { createFiberFromElement, createFiberFromText, FiberNode } from "../../ReactFiber";

export const createChild = (returnFiber: FiberNode, newChild: ReactNode, renderExpirationTime: number) => {
  if (isObject(newChild)) {
    return createElementFiber(returnFiber, newChild as ReactElement, renderExpirationTime);
  } else if (isText(newChild)) {
    const created = createFiberFromText(newChild as string, renderExpirationTime);
    created.return = returnFiber;
    return created;
  }
  return null;
}

/**
 * 根据 object 类型创建对应的 fiber
 */
export const createElementFiber = (returnFiber: FiberNode, newChild: ReactElement, renderExpirationTime: number) => {
  switch(newChild.$$typeof) {
    case REACT_ELEMENT_TYPE:
      const created = createFiberFromElement(newChild, renderExpirationTime);
      created.return = returnFiber;
      return created;
    default:
      return null;
  }
}
