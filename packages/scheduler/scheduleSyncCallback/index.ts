import { SchedulerSyncCallback, SchedulerPriorityLevel, SchedulerTask } from "../interface";
import { cancelCallback, scheduleCallback } from "../schedulerCallback";
import { getCurrentPriorityLevel, setCurrentPriorityLevel } from "../schedulerCallback/requestHostCallback";

export type FakeSchedulerSyncTask = Record<any, any>;

// 保存所有同步任务的队列
let syncQueue: SchedulerSyncCallback[] | null = null;
let immediateQueueCallbackNode: SchedulerTask | null = null;

export const fakeCallbackNode: FakeSchedulerSyncTask = {};
// 在执行 syncCallback 阶段
let isFlushingSyncQueue = false;

export const scheduleSyncCallback = (callback: SchedulerSyncCallback) => {
  if (syncQueue === null) {
    syncQueue = [callback];
    // Flush the queue in the next tick, at the earliest.
    immediateQueueCallbackNode = scheduleCallback(
      SchedulerPriorityLevel.ImmediateSchedulerPriority,
      flushSyncCallbackQueueImpl,
    );
  } else {
    syncQueue.push(callback);
  }
  return fakeCallbackNode;
}

// 执行同步任务
export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    // 如果有正在schedule的立即执行任务还未执行，取消他的schedule，立即同步执行他
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}

function flushSyncCallbackQueueImpl() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    try {
      const isSync = true;
      const queue = syncQueue;
      runWithPriority(SchedulerPriorityLevel.ImmediateSchedulerPriority, () => {
        for (; i < queue.length; i++) {
          let callback: SchedulerSyncCallback | null = queue[i];
          do {
            callback = callback?.(isSync);
          } while (callback !== null)
        }
      });
      syncQueue = null;
    } catch(e) {
      // 如果某个任务报错，将他从queue中去除, 然后继续调度
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      scheduleCallback(SchedulerPriorityLevel.ImmediateSchedulerPriority, flushSyncCallbackQueue);
      throw e;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
}

export const runWithPriority = (priorityLevel: SchedulerPriorityLevel, eventHandler: () => void) => {
  switch (priorityLevel) {
    case SchedulerPriorityLevel.ImmediateSchedulerPriority:
    case SchedulerPriorityLevel.UserBlockingSchedulerPriority:
    case SchedulerPriorityLevel.NormalSchedulerPriority:
    case SchedulerPriorityLevel.LowSchedulerPriority:
    case SchedulerPriorityLevel.IdleSchedulerPriority:
      break;
    default:
      priorityLevel = SchedulerPriorityLevel.NormalSchedulerPriority;
  }

  let previousPriorityLevel = getCurrentPriorityLevel();

  try {
    setCurrentPriorityLevel(priorityLevel);
    return eventHandler();
  } finally {
    setCurrentPriorityLevel(previousPriorityLevel);
  }
}
