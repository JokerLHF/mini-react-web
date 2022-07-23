import { SchedulerPriorityLevel, SchedulerPriorityTimeout } from '../interface';

// react 有兼容 performance 不存在的情况
export const getCurrentTime = () => {
	return performance.now();
};

// 根据优先级计算延迟时间
export const timeoutForPriorityLevel = (priorityLevel: SchedulerPriorityLevel) => {
	switch (priorityLevel) {
	case SchedulerPriorityLevel.ImmediateSchedulerPriority:
		return SchedulerPriorityTimeout.IMMEDIATE_PRIORITY_TIMEOUT;
	case SchedulerPriorityLevel.UserBlockingSchedulerPriority:
		return SchedulerPriorityTimeout.USER_BLOCKING_PRIORITY_TIMEOUT;
	case SchedulerPriorityLevel.IdleSchedulerPriority:
		return SchedulerPriorityTimeout.IDLE_PRIORITY_TIMEOUT;
	case SchedulerPriorityLevel.LowSchedulerPriority:
		return SchedulerPriorityTimeout.LOW_PRIORITY_TIMEOUT;
	case SchedulerPriorityLevel.NormalSchedulerPriority:
	default:
		return SchedulerPriorityTimeout.NORMAL_PRIORITY_TIMEOUT;
	}
};