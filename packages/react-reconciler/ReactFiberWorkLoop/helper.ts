import { ReactRoot } from "../../react-dom/ReactRoot";
import { FiberNode } from "../ReactFiber";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";

export function getRemainingExpirationTime(fiber: FiberNode) {
  const updateExpirationTime = fiber.expirationTime;
  const childExpirationTime = fiber.childExpirationTime;
  return updateExpirationTime > childExpirationTime ? updateExpirationTime : childExpirationTime;
}

export function markRootFinishedAtTime(root: ReactRoot, finishedExpirationTime: number, remainingExpirationTime: number) {
  root.firstPendingTime = remainingExpirationTime;

  if (finishedExpirationTime <= root.lastExpiredTime) {
    // 优先级比lastExpiredTime更低的任务已经完成
    root.lastExpiredTime = ReactExpirationTime.NoWork;
  }
}

// 标记时间片不够用而中断的任务的expirationTime
export function markRootExpiredAtTime(root: ReactRoot, expirationTime: number) {
  const lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime === ReactExpirationTime.NoWork || lastExpiredTime > expirationTime) {
    // lastExpiredTime指fiber上存在的最低优先级的过期任务expirationTime
    // lastExpiredTime > expirationTime 表示fiber已经存在的过期任务的优先级更高
    // 由于是过期任务，高优先级expiredTime对应任务已经同步执行过
    // 所以将高优先级expiredTime替换为低优先级expiredTime
    root.lastExpiredTime = expirationTime;
  }
}

/**
 * 因为过期的任务会一个新的 expirationTime 进入调度。所以此时的 lastExpiredTime 和 firstPendingTime 会不一样
 */
export function getNextRootExpirationTimeToWorkOn(root: ReactRoot) {
  const lastExpiredTime = root.lastExpiredTime;
  const firstPendingTime = root.firstPendingTime;

  if (lastExpiredTime !== ReactExpirationTime.NoWork) {
    // 有过期任务
    return lastExpiredTime;
  }
  // TODO suspense
  return firstPendingTime;
}