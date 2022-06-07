export interface SchedulerOptions {
  delay?: number, // 表示任务延迟多长时间开始进行调度
}

export type SchedulerCallback = (
  (didUserCallbackTimeout: boolean) => (null | void | SchedulerCallback)
);

export type SchedulerSyncCallback = (
  (isSync: boolean) => (null | SchedulerSyncCallback)
);

export enum SchedulerPriorityLevel {
  ImmediateSchedulerPriority = 99,       // 立即执行的优先级，级别最高
  UserBlockingSchedulerPriority = 98,    // 用户阻塞级别的优先级（drag、scroll、mouseover）
  NormalSchedulerPriority = 97,          // 正常的优先级
  LowSchedulerPriority = 96,             // 较低的优先级
  IdleSchedulerPriority = 95,            // 不会过期
  NoSchedulerPriority = 90,
}

export enum SchedulerPriorityTimeout {
  IMMEDIATE_PRIORITY_TIMEOUT = -1,
  USER_BLOCKING_PRIORITY_TIMEOUT = 250,
  NORMAL_PRIORITY_TIMEOUT = 5000,
  LOW_PRIORITY_TIMEOUT = 10000,
  IDLE_PRIORITY_TIMEOUT = Math.pow(2, 30) - 1,   // 永远不会过期(虽然这样说，但是只有12.5天保质期)
}

export interface SchedulerTask {
  id: number,
  callback: SchedulerCallback | null,
  priorityLevel: SchedulerPriorityLevel,
  startTime: number,
  expirationTime: number,
  /**
   * 最小堆的排序方式:
   * 任务队列是过期时间，值越小表示越早过期排在越前。
   * 延迟队列是开始调度时间，值越小表示越早开始排在越前
   */
  sortIndex: number,
}
