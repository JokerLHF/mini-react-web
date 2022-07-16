import { getCurrentTime } from "./helper";
import { taskQueue, timerQueue } from ".";
import { advanceTimers, cancelHostTimeout, getIsHostTimeoutScheduled, handleTimeout, requestHostTimeout, setIsHostTimeoutScheduled } from "./requestHostTimeout";
import { peek, pop } from "../minHeap";
import { SchedulerPriorityLevel, SchedulerTask } from "../interface";

// 调度阶段
let isHostCallbackScheduled = false;
// 通过 messageChanel 进行事件循环阶段
let isMessageLoopRunning = false;
// 执行任务阶段
let isPerformingWork = false;

// 任务开始被执行的时间
let taskStartTime = -1;
// 当前执行任务的优先级
let currentPriorityLevel = SchedulerPriorityLevel.NormalSchedulerPriority;
// 当前执行的任务
let currentTask: SchedulerTask | null = null;
// 从开始事件循环到执行任务的时间
const frameYieldMs = 5;

// 从开始事件循环到执行任务只有 5ms，操作 5ms 就要中断进入下一次事件循环继续调度
export const shouldYieldToHost = () => {
  const timeElapsed = getCurrentTime() - taskStartTime;
  if (timeElapsed < frameYieldMs) {
    return false;
  }

  return true;
}

const workLoop = (initialTime: number) => {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  // 每次从taskQueue获取task前都会advanceTimers看看有没有task到了startTime需要加入taskQueue
  currentTask = peek(taskQueue);

  // 循环taskQueue执行task，直到时间用尽（5ms），或任务没到过期时间
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 当前task还未过期，且本次调度没有剩余时间，deadline === currentTime + yieldInterval(5ms)
      // 由于taskQueue是优先队列，currentTask未过期则其后所有task也未过期
      break;
    }
    // 即使未到task 过期时间，但是本次调度有剩余时间也会执行回调
    const callback = currentTask.callback;

    if (callback !== null) {
      // 将当前task callback清除，这样再进入workLoop该task会被pop
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;

      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);

      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          // 执行完任务后删除任务
          pop(taskQueue);
        }
      }

      currentTime = getCurrentTime();
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue);
  }

  // 函数返回值代表： 是否taskQueue中还有task
  if (currentTask !== null) {
    return true;
  } else {
    // taskQueue已执行完清空，从timerQueue中取出task放入taskQueue
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

const flushWork = (currentTime: number) => {
   // We scheduled a timeout but it's no longer needed. Cancel it.
  if (getIsHostTimeoutScheduled()) {
    setIsHostTimeoutScheduled(false);
    cancelHostTimeout();
  }

  isHostCallbackScheduled = false;
  isPerformingWork = true;
  try {
    return workLoop(currentTime);
  } finally {
    isPerformingWork = false;
  }
}

const performWorkUntilDeadline = () => {
  const currentTime = taskStartTime = getCurrentTime();
  let hasMoreWork = true;
  try {
    hasMoreWork = flushWork(currentTime);
  } finally {
    // 存在任务就证明中断了，需要进入下一轮事件循环继续调度
    if (hasMoreWork) {
      schedulePerformWorkUntilDeadline?.();
    } else {
      isMessageLoopRunning = false;
    }
  }
}

/**
 * 选择通信 api
 */
let schedulePerformWorkUntilDeadline: (() => void) | null = null;
if (typeof MessageChannel !== 'undefined') {
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
} else {
  schedulePerformWorkUntilDeadline = () => {
    setTimeout(performWorkUntilDeadline, 0);
  };
}

export const requestHostCallback = () => {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline?.();
  }
}

/**
 * 下面是一个全局变量的 get 和 set 方法
 */

export function getCurrentPriorityLevel() {
  return currentPriorityLevel;
}

export function setCurrentPriorityLevel(priorityLevel: SchedulerPriorityLevel) {
  currentPriorityLevel = priorityLevel;
}

export const getIsHostCallbackScheduled = () => {
  return isHostCallbackScheduled;
}

export const setIsHostCallbackScheduled = (scheduler: boolean) => {
  isHostCallbackScheduled = scheduler;
}

export const getIsPerformance = () => {
  return isPerformingWork;
}