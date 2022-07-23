import { taskQueue, timerQueue } from './index';
import { peek, pop, push } from '../minHeap';
import { getCurrentTime } from './helper';
import { getIsHostCallbackScheduled, requestHostCallback, setIsHostCallbackScheduled } from './requestHostCallback';

let taskTimeoutID = -1;
// 调度阶段
let isHostTimeoutScheduled = false;

export const requestHostTimeout = (callback: (curTime: number) => void, ms: number) => {
	taskTimeoutID = window.setTimeout(() => {
		callback(getCurrentTime());
	}, ms);
};

export const cancelHostTimeout = () => {
	clearTimeout(taskTimeoutID);
	taskTimeoutID = -1;
};

/**
 *  遍历timerQueue，将过期的timer取出加入taskQueue
 */
export const advanceTimers = (currentTime: number) => {
	let timer = peek(timerQueue);

	while (timer !== null) {
		if (timer.callback === null) {
			// 取消没有 callback 的 timer
			pop(timerQueue);
		} else if (timer.startTime <= currentTime) {
			pop(timerQueue);
			// sortIndex === startTime
			// expirationTime === startTime + timeout
			timer.sortIndex = timer.expirationTime;
			push(taskQueue, timer);
		} else {
			// 余下的timer都处于延迟状态
			return;
		}

		timer = peek(timerQueue);
	} 
};

export const handleTimeout = (currentTime: number) => {
	isHostTimeoutScheduled = false;
	advanceTimers(currentTime);
	if (!getIsHostCallbackScheduled()) {
		if (peek(taskQueue) !== null) {
			setIsHostCallbackScheduled(true);
			requestHostCallback();
		} else {
			const firstTimer = peek(timerQueue);
			if (firstTimer !== null) {
				requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
			}
		}
	}
};

/**
 * 下面是全局变量的 get 和 set 方法
 */

export const getIsHostTimeoutScheduled = () => {
	return isHostTimeoutScheduled;
};

export const setIsHostTimeoutScheduled = (scheduler: boolean) => {
	isHostTimeoutScheduled = scheduler;
};