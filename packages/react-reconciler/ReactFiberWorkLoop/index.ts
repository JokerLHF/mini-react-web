import { ReactRoot } from "../../react-dom/ReactRoot";
import { cancelCallback, getCurrentTime, scheduleCallback, scheduleSyncCallback } from "../../scheduler";
import { SchedulerPriorityLevel } from "../../scheduler/interface";
import { createWorkInProgress, FiberNode } from "../ReactFiber";
import { beginWork } from "../ReactFiberBeginWork";
import { completeUnitOfWork } from "../ReactFiberCompleteWork";
import { expirationTimeToMs } from "../ReactFiberExpirationTime";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";
import { inferPriorityFromExpirationTime, requestCurrentTimeForUpdate } from "../ReactFiberExpirationTime/updateExpirationTime";
import { setRenderExpirationTime, setWorkInProgress } from "./const";
import { getNextRootExpirationTimeToWorkOn, markUpdateTimeFromFiberToRoot } from "./helper";
import { performConcurrentWorkOnRoot } from "./workLoopConcurrent";
import { performSyncWorkOnRoot } from "./workLoopSync";

export const prepareFreshStack = (root: ReactRoot, expirationTime: number) => {
  root.finishedExpirationTime = ReactExpirationTime.NoWork;
  const workInProgress = createWorkInProgress(root.current, null);

  setWorkInProgress(workInProgress);
  setRenderExpirationTime(expirationTime);
}

export const performUnitOfWork = (unitOfWork: FiberNode) => {
  const current = unitOfWork.alternate;
  // beginWork会返回fiber.child，不存在next意味着深度优先遍历已经遍历到某个子树的最深层叶子节点
  let next = beginWork(current, unitOfWork);
  if (!next) {
    next = completeUnitOfWork(unitOfWork);
  }
  return next;
}

/**
 * 1. 判断 root 上有过期任务，需要以 ImmediatePriority 立刻调度该任务
 * 2. root 上没有待执行的任务，结束函数
 * 3. root 上已有 schedule 但还未到时间执行的任务，比较新旧任务 expirationTime 和优先级处理
 * 4. root 上还没有已有 schedule 的任务，则开始调度任务
 */
export const ensureRootIsScheduled = (root: ReactRoot) => {
  const lastExpiredTime = root.lastExpiredTime;
  /**
   * 情况1: root 上有过期任务，需要以 ImmediatePriority 立刻调度该任务
   */
  if (lastExpiredTime) {
    root.callbackPriority = SchedulerPriorityLevel.ImmediateSchedulerPriority;
    root.callbackExpirationTime = ReactExpirationTime.Sync;
    root.callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    return;
  }

  /**
   * 情况2: root 上没有待执行的任务，结束函数
   */
  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  const existingCallbackNode = root.callbackNode;
  if (expirationTime === ReactExpirationTime.NoWork) {
    if (existingCallbackNode) {
      root.callbackNode = null;
      root.callbackExpirationTime = ReactExpirationTime.NoWork;
      root.callbackPriority = SchedulerPriorityLevel.NoSchedulerPriority;
    }
    return;
  }

  /**
   * 情况3: root 上已有 schedule 但还未到时间执行的任务，比较新旧任务 expirationTime 和优先级处理
   */
  // 从当前时间和expirationTime推断任务优先级
  const currentTime = requestCurrentTimeForUpdate();
  const priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime);
  if (existingCallbackNode) {
    // 做优先级判断
    const existingCallbackNodePriority = root.callbackPriority;
    const existingCallbackExpirationTime = root.callbackExpirationTime;
    if (expirationTime === existingCallbackExpirationTime && existingCallbackNodePriority >= priorityLevel) {
      return;
    }
    cancelCallback(existingCallbackNode)
  }

  /**
   * 情况4 根据优先级选择同步或者异步调度
   */
  let callbackNode;
  if (expirationTime === ReactExpirationTime.Sync) {
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
      /**
       * TODO：这里其实还不太理解为什么 需要增加 timeout。也不太理解为什么在 computedFiberForUpdate 的时候需要增加过期时间。先这样
       * 这个 expirationTime 如果是从 firstPendingTime 拿到的，那么就是从 setState 中计算的，那么 expirationTime 已经根据优先级增加了对应的延期时间，
       */
      { timeout: expirationTimeToMs(expirationTime) - getCurrentTime() }
    );
  }

  root.callbackNode = callbackNode;
  root.callbackPriority = priorityLevel;
  root.callbackExpirationTime = expirationTime;
}

export const scheduleUpdateOnFiber = (fiber: FiberNode, expirationTime: number) => {
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (root !== null) {
    ensureRootIsScheduled(root);
  }
}