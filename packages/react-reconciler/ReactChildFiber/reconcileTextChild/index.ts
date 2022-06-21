import { ReactFiberTag } from "../../interface/fiber";
import { createFiberFromText, FiberNode } from "../../ReactFiber";
import { useFiberAsSingle } from "../helper/cloneChild";
import { deleteRemainingChildren } from "../helper/deleteChild";
import { placeSingleChild } from "../helper/placeChild";

/**
 * - React文本节点的 diff 比较简单粗暴：
 * - update 时：直接找 oldFiber 的第一个节点，如果是文字节点就复用，如果不是就删除全部老的节点，创建新的文本节点。
 * - mount 时：新建文本节点
 */
export const reconcileSingleTextChild = (returnFiber: FiberNode,  currentFirstChild: FiberNode | null, newChild: string) => {
  // update 阶段
  if (currentFirstChild && currentFirstChild.tag === ReactFiberTag.HostText) { // 在写 jsx 的时候文本节点是没有办法自定义 key 的。所以文本节点只能通过 tag 去判断
    // 在旧节点中找到可以复用的节点，其他旧节点
    deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
    // 复用 oldFiber
    const existing = useFiberAsSingle(currentFirstChild, newChild);
    existing.return = returnFiber;
    return placeSingleChild(existing);
  }
  // mount 阶段
  const created = createFiberFromText(newChild);
  created.return = returnFiber;
  return placeSingleChild(created);
}
