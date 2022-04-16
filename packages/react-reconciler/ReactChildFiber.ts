import { ReactNode, ReactNodeChild, ReactNodeChildren } from "../react/interface";
import { REACT_ELEMENT_TYPE } from "../shared/ReactSymbols";
import { isArray, isObject, isRawChildren } from "../shared/utils";
import { ReactFiberSideEffectTags } from "./interface/fiber";
import { createFiberFromElement, createFiberFromText, FiberNode } from "./ReactFiber";


// TODO: 这里感觉使用闭包不是很优雅，但是使用 class 其实也是差不多的写法
const ChildReconciler = (shouldTrackSideEffects: boolean) => {

  // fiber 标记 effectTag，表示需要在commit阶段插入DOM
  const placeSingleChild = (fiber: FiberNode) => {
    // alternate存在表示该fiber已经插入到DOM
    if (shouldTrackSideEffects && !fiber.alternate) {
      fiber.effectTag = ReactFiberSideEffectTags.Placement;
    }
    return fiber;
  }

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
        const elementFiber = reconcileSingleElement(returnFiber, newChild);
        return placeSingleChild(elementFiber);
      default:
        return null;
    }
  }

  const reconcileChildrenText = (returnFiber: FiberNode, newChild: string) => {
    const textFiber = reconcileSingleTextNode(returnFiber, newChild);
    return placeSingleChild(textFiber);
  }

  /**
   * 数组的 fiber 有 sibling 的关系链
   */
  const reconcileChildrenArray = (returnFiber: FiberNode, newChildren: ReactNodeChild[]): FiberNode | null => {
    let first: FiberNode | null = null;
    let prev: FiberNode | null = null;
    for(let i = 0; i < newChildren.length; i++) {
      const newFiber = reconcileChildFibers(returnFiber, newChildren[i]);
      if (!newFiber) {
        continue;
      }
      placeSingleChild(newFiber);
  
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

  /**
   * 根据 newChild 的类型生成对于的 fiber 节点
   */
  const reconcileChildFibers = (returnFiber: FiberNode, newChild: ReactNodeChildren): FiberNode | null => {
    if (isObject(newChild)) {
      return reconcileChildrenObject(returnFiber, newChild as ReactNode);
    } else if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, newChild as ReactNodeChild[])
    } else if (isRawChildren(newChild)) {
      return reconcileChildrenText(returnFiber, newChild as string);
    }
    return null;
  }
  return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

