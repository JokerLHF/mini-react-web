import { ReactRoot } from "../../react-dom/ReactRoot";
import { FiberRoot, ReactFiberTag } from "../interface/fiber";
import { createWorkInProgress, FiberNode } from "../ReactFiber";
import { beginWork } from "../ReactFiberBeginWork";
import { commitRoot } from "../ReactFiberCommitWork";
import { completeUnitOfWork } from "../ReactFiberCompleteWork";

let workInProgress: FiberNode | null = null;

// 从 fiber 向上直到 reactRoot
const markUpdateTimeFromFiberToRoot = (fiber: FiberNode) => {
  let reactRoot = null;
  let node = fiber.return;

  if (!node && fiber.tag === ReactFiberTag.HostRoot) {
    reactRoot = (fiber as FiberRoot).stateNode;
  } else {
    while (node) {
      if (!node.return && node.tag === ReactFiberTag.HostRoot) {
        reactRoot = (node as FiberRoot).stateNode;
        break;
      }
      node = node.return;
    }
  }

  return reactRoot;
}

const prepareFreshStack = (reactRoot: ReactRoot) => {
  workInProgress = createWorkInProgress(reactRoot.current, null);
}

const workLoopSync = () => {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

const performSyncWorkOnRoot = (reactRoot: ReactRoot) => {
  // render 阶段
  console.log('开始 render 阶段');
  workLoopSync();
  // commit 阶段
  console.log('开始 commitRoot 阶段');
  commitRoot(reactRoot);
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
  const reactRoot = markUpdateTimeFromFiberToRoot(fiber);
  if (reactRoot !== null) {
    prepareFreshStack(reactRoot);
    performSyncWorkOnRoot(reactRoot);
  }
}