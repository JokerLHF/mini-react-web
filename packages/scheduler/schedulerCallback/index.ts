import { getCurrentTime, timeoutForPriorityLevel } from "./helper";
import { getIsHostCallbackScheduled, requestHostCallback, setIsHostCallbackScheduled } from "./requestHostCallback";
import { cancelHostTimeout, getIsHostTimeoutScheduled, handleTimeout, requestHostTimeout, setIsHostTimeoutScheduled } from "./requestHostTimeout";
import { SchedulerCallback, SchedulerOptions, SchedulerPriorityLevel, SchedulerTask } from "../interface";
import { peek, push } from "../minHeap";

let taskIdCounter = 0;

// 延迟队列和任务队列
export const timerQueue: SchedulerTask[] = [];
export const taskQueue: SchedulerTask[] = [];

export const scheduleCallback = (priorityLevel: SchedulerPriorityLevel, callback: SchedulerCallback, options?: SchedulerOptions) => {
  const currentTime = getCurrentTime();
  const { delay = 0 } = options || {};

  const startTime = delay > 0 ? currentTime + delay : currentTime;
  const timeout = timeoutForPriorityLevel(priorityLevel);
  const expirationTime = startTime + timeout;

  const newTask: SchedulerTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  // options 传入 delay 的延迟任务
  if (startTime > currentTime) {
    newTask.sortIndex = startTime;
    // 延迟任务加到 timerQueue, 并按照 sortIndex 排序。startTime 值越小表示越早开始排在越前 
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && peek(timerQueue) === newTask) {
      getIsHostTimeoutScheduled() ? cancelHostTimeout() : setIsHostTimeoutScheduled(true);
      // 开始调度延迟队列
      requestHostTimeout(handleTimeout, delay);
    }
  } else {
    newTask.sortIndex = expirationTime;
    // 正常任务加到 taskQueue, 并按照 sortIndex expirationTime 值越小表示越早过期排在越前 
    push(taskQueue, newTask);
    if (!getIsHostCallbackScheduled()) {
      setIsHostCallbackScheduled(true);
      // 开始调度任务队列
      requestHostCallback();
    }
  }

  return newTask;
}

export const cancelCallback = (task: SchedulerTask) => {
  task.callback = null;
}