import { ReactRoot } from "@mini/react-dom";
import { ReactFiberTag } from "../../interface/fiber";
import { FiberNode } from "../../ReactFiber";
import { getHostParentFiber, getHostSibling, insertOrAppendPlacementNode } from "./helper";

/**
 * 1. 找 host 类的父节点
 * 2. 找 host 类的兄弟节点
 * 3. 根据父节点和兄弟节点确认插入位置, 如果存在兄弟节点，插到兄弟节点前面，没有插入到父节点
 */
export const commitPlacement = (finishedWork: FiberNode) => {
  const parentFiber = getHostParentFiber(finishedWork);
  const parentStateNode = parentFiber.stateNode;

  let parent;
  switch (parentFiber.tag) {
    case ReactFiberTag.HostComponent:
      parent = parentStateNode as HTMLElement;
      break;
    case ReactFiberTag.HostRoot:
      parent = (parentStateNode as ReactRoot).containerInfo;
      break;
    default:
      throw new Error(
        'Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.',
      );
  }

  // 目标DOM节点需要插入在谁之前
  const before = getHostSibling(finishedWork) as HTMLElement | Text | null;
  insertOrAppendPlacementNode(finishedWork, before, parent);
}