import { FiberRoot, ReactFiberTag } from "./interface/fiber";
import { createWorkInProgress, FiberNode } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitRoot } from "./ReactFiberCommitWork";
import { completeUnitOfWork } from "./ReactFiberCompleteWork";

let workInProgress: FiberNode | null = null;

// 从 fiber 向上直到 FiberRoot
const markUpdateTimeFromFiberToRoot = (fiber: FiberNode) => {
  let rootFiber = null;
  let node = fiber.return;

  if (!node && fiber.tag === ReactFiberTag.HostRoot) {
    rootFiber = fiber as FiberRoot;
  } else {
    while (node) {
      if (!node.return && node.tag === ReactFiberTag.HostRoot) {
        rootFiber = node as FiberRoot;
        break;
      }
      node = node.return;
    }
  }

  return rootFiber;
}

const prepareFreshStack = (rootFiber: FiberRoot) => {
  workInProgress = createWorkInProgress(rootFiber, {});
}

const workLoopSync = () => {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

const performSyncWorkOnRoot = (root: FiberRoot) => {
  // render 阶段
  console.log('开始 render 阶段');
  workLoopSync();
  // commit 阶段
  console.log('开始 commitRoot 阶段');
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

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
  const root = markUpdateTimeFromFiberToRoot(fiber);
  if (root !== null) {
    prepareFreshStack(root);
    performSyncWorkOnRoot(root);
  }
}

