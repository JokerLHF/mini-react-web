import { ReactFiberTag } from "./interface";
import { createWorkInProgress, FiberNode } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitRoot } from "./ReactFiberCommitWork";
import { completeUnitOfWork } from "./ReactFiberCompleteWork";

let workInProgress: FiberNode | null = null;

// 从 fiber 向上直到 RootFiber
const markUpdateTimeFromFiberToRoot = (fiber: FiberNode): FiberNode => {
  let rootFiber;
  let node = fiber.return;

  if (!node && fiber.tag === ReactFiberTag.HostRoot) {
    rootFiber = fiber;
  } else {
    while (node) {
      if (!node.return && node.tag === ReactFiberTag.HostRoot) {
        rootFiber = node;
        break;
      }
      node = node.return;
    }
  }
  return rootFiber as FiberNode;
}

const prepareFreshStack = (rootFiber: FiberNode, expirationTime: number) => {
  workInProgress = createWorkInProgress(rootFiber, {});
}

const workLoopSync = () => {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

const performSyncWorkOnRoot = (root: FiberNode) => {
  workLoopSync();
  // render阶段结束，进入commit阶段
  commitRoot(root);
}

const performUnitOfWork = (unitOfWork: FiberNode) => {
  const current = unitOfWork.alternate;
  // beginWork会返回fiber.child，不存在next意味着深度优先遍历已经遍历到某个子树的最深层叶子节点
  let next = beginWork(current, unitOfWork);
  if (!next) {
    console.log('到达叶子节点', unitOfWork);
    next = completeUnitOfWork(unitOfWork);
  }
  return next;
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, expirationTime: number) => {
  const root = markUpdateTimeFromFiberToRoot(fiber);
  prepareFreshStack(root, expirationTime);
  performSyncWorkOnRoot(root);
}

