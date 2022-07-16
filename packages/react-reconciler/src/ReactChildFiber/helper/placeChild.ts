import { shouldTrackSideEffects } from "../index";
import { ReactFiberSideEffectTags } from "../../interface/fiber";
import { FiberNode } from "../../ReactFiber";

/**
 * fiber 标记 effectTag，表示需要在commit阶段插入DOM
 */
export const placeSingleChild = (fiber: FiberNode) => {
  // alternate存在表示该fiber已经插入到DOM
  if (shouldTrackSideEffects() && !fiber.alternate) {
    fiber.effectTag |= ReactFiberSideEffectTags.Placement;
  }
  return fiber;
}

/**
 * 1. 如果 newFiber 是新建的 fiber 节点。做上插入的标记
 * 2. 如果 newFiber 是复用的 fiber 节点，通过判断 oldIndex 和 lastPlacedIndex 的大小
 *    - lastPlacedIndex > oldIndex: 需要加上移动标记
 *    - lastPlacedIndex < oldIndex: 不需要加上标记
 * 
 * 举个例子：
 * - old: A => B => C
 * - new: [C, A, D]
 * - 到C到时候  oldIndex = 1, lastPlacedIndex = 0 所以 lastPlacedIndex = 1
 * - 到A的时候  oldIndex = 0, lastPlacedIndex = 1 当前【新A】可复用的【旧A】节点在上一个可复用的【旧C】节点的左边。但是其实【新A】应该在【新C】的右边。   
 *     - 所以虽然复用了 fiber，但是此时 A 的 dom 结构是在 C 左边的，所以需要标记需要移动。在 commitWork 的时候再移动到 C 右边
 */
export const placeChild = (newFiber: FiberNode, lastPlacedIndex: number) => {
  if (!shouldTrackSideEffects()) {
    return lastPlacedIndex;
  }
  // 如果 newFiber 是复用的话，就会存在 alternate。但是如果是新建的话就没有 alternate
  const current = newFiber.alternate;
  if (current) {
    const oldIndex = current.index;
    if (lastPlacedIndex > oldIndex) {
      newFiber.effectTag |= ReactFiberSideEffectTags.Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    newFiber.effectTag |= ReactFiberSideEffectTags.Placement;
    return lastPlacedIndex;
  }
}