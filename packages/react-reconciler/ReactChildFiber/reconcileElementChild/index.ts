import { ReactNode } from "../../../react/interface";
import { REACT_ELEMENT_TYPE } from "../../../shared/ReactSymbols";
import { FiberNode } from "../../ReactFiber";
import { placeSingleChild } from "../helper/placeChild";
import { reconcileSingleElement } from "./reconcileSingleChild";

export const reconcileSingleElementChild = (returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: ReactNode) => {
  switch (newChild.$$typeof) {
    case REACT_ELEMENT_TYPE:
      const newFiber = reconcileSingleElement(returnFiber, currentFirstChild, newChild as ReactNode);
      return placeSingleChild(newFiber);
    default:
      return null;
  }
}