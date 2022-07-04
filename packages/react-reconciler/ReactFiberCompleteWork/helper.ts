import { FiberNode } from "../ReactFiber";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";

/**
 * 背景：
 *    - 在 beginWork 阶段已经将需要 Update 的 FunctionComponent fiber 标记上 effectTag，
 *    - 在 diff 阶段已经将需要 Place/Delete 等 fiber 标记上 effectTag。在 commit 阶段为了不需要重新遍历一遍 fiber 树找出标记有 effectTag 的 fiber。
 *    - 在 completeWork 中，对于 textFiber 对比文本是否变化，对于 hostComponent 对比 props 是否变化
 * 这里将带有 effectTag 的 fiber 串起来放在 effectList 中，这样一级级递归上去后，根节点会有一条本次更新带有 effectTag 的 fiber 列表。 commit 阶段只需要遍历 effectList 即可
 * 注意这里是一个单项链表，firstEffect指向表头， lastEffect指向表尾
 */
export const collectEffectListToParent = (returnFiber: FiberNode | null, workInProgress: FiberNode) => {
  if (!returnFiber) {
    return;
  }
  // 1. 将 workInProgress 的子节点的 effectList append 到 returnFiber 上
  if (!returnFiber.firstEffect) {
    returnFiber.firstEffect = workInProgress.firstEffect;
  }
  if (workInProgress.lastEffect) {
    if (returnFiber.lastEffect) {
      returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
    }
    returnFiber.lastEffect = workInProgress.lastEffect;
  }
  // 2.  将 workInProgress 本身的 append 到 returnFiber 上
  const effectTag = workInProgress.effectTag;
  if (effectTag) {
    if (returnFiber.lastEffect) {
      returnFiber.lastEffect.nextEffect = workInProgress;
    } else {
      returnFiber.firstEffect = workInProgress;
    }
    returnFiber.lastEffect = workInProgress;
  }
}

export const createTextInstance = (text: string) => {
  const textElement = document.createTextNode(text);
  return textElement;
}

export const createInstance = (type: string) => {
  const domElement = document.createElement(type);
  return domElement;
}

const randomKey = Math.random().toString(36).slice(2);
export const internalInstanceKey = '__reactFiber$' + randomKey;
export function precacheFiberNode(fiber: FiberNode, node: HTMLElement | Text) {
  (node as any)[internalInstanceKey] = fiber;
}


export function resetChildExpirationTime(completedWork: FiberNode) {
  let newChildExpirationTime = ReactExpirationTime.NoWork;
  let child = completedWork.child;

  while (child) {
    const childUpdateExpirationTime = child.expirationTime;
    const childChildExpirationTime = child.childExpirationTime;

    // 比较所有子节点的 childUpdateExpirationTime childChildExpirationTime 最大值
    const childMaxExpirationTime = Math.max(childUpdateExpirationTime, childChildExpirationTime);
    newChildExpirationTime = Math.max(childMaxExpirationTime, newChildExpirationTime);

    child = child.sibling;
  }
  completedWork.childExpirationTime = newChildExpirationTime;
}
