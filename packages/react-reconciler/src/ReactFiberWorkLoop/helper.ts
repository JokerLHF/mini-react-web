import { ReactRoot } from '@mini/react-dom';
import { FiberRoot, ReactFiberTag } from '../interface/fiber';
import { FiberNode } from '../ReactFiber';
import { ReactExpirationTime } from '../ReactFiberExpirationTime/interface';

export const getRemainingExpirationTime = (fiber: FiberNode) => {
	const updateExpirationTime = fiber.expirationTime;
	const childExpirationTime = fiber.childExpirationTime;
	return updateExpirationTime > childExpirationTime ? updateExpirationTime : childExpirationTime;
};

export const markRootFinishedAtTime = (root: ReactRoot, finishedExpirationTime: number, remainingExpirationTime: number) => {
	root.firstPendingTime = remainingExpirationTime;

	if (finishedExpirationTime <= root.lastExpiredTime) {
		// 优先级比lastExpiredTime更低的任务已经完成
		root.lastExpiredTime = ReactExpirationTime.NoWork;
	}
};

export const markRootUpdatedAtTime = (root: ReactRoot, expirationTime: number) => {
	if (expirationTime > root.firstPendingTime) {
		root.firstPendingTime = expirationTime;
	}
};

// 标记时间片不够用而中断的任务的expirationTime
export const markRootExpiredAtTime = (root: ReactRoot, expirationTime: number) => {
	const lastExpiredTime = root.lastExpiredTime;

	if (lastExpiredTime === ReactExpirationTime.NoWork || lastExpiredTime > expirationTime) {
		// lastExpiredTime指fiber上存在的最低优先级的过期任务expirationTime
		// lastExpiredTime > expirationTime 表示fiber已经存在的过期任务的优先级更高
		// 由于是过期任务，高优先级expiredTime对应任务已经同步执行过
		// 所以将高优先级expiredTime替换为低优先级expiredTime
		root.lastExpiredTime = expirationTime;
	}
};

/**
 * 因为过期的任务会一个新的 expirationTime 进入调度。所以此时的 lastExpiredTime 和 firstPendingTime 会不一样
 */
export const getNextRootExpirationTimeToWorkOn = (root: ReactRoot) => {
	const lastExpiredTime = root.lastExpiredTime;
	const firstPendingTime = root.firstPendingTime;

	if (lastExpiredTime !== ReactExpirationTime.NoWork) {
		// 有过期任务
		return lastExpiredTime;
	}
	return firstPendingTime;
};

/**
 * 1. fiber 本身加上 expirationTime
 * 2. expirationTime 向上传递到 fiberRoot
 * 3. 标记 root 的 pendingTime
 */
export const markUpdateTimeFromFiberToRoot = (fiber: FiberNode, expirationTime: number) => {
	let root: ReactRoot | null = null;
	let node = fiber.return;

	if (fiber.expirationTime < expirationTime) {
		// 更新触发update的fiber的expirationTime
		fiber.expirationTime = expirationTime;
	}
	let alternate = fiber.alternate;
	if (alternate && alternate.expirationTime < expirationTime) {
		// 同时更新 alternate
		alternate.expirationTime = expirationTime;
	}

	if (!node && fiber.tag === ReactFiberTag.HostRoot) {
		root = (fiber as FiberRoot).stateNode;
	} else {
		while (node) {
			// 更新childExpirationTime
			alternate = node.alternate;
			if (node.childExpirationTime < expirationTime) {
				node.childExpirationTime = expirationTime;
			} 
			if (alternate && alternate.childExpirationTime < expirationTime) {
				alternate.childExpirationTime = expirationTime;
			}
  
			if (!node.return && node.tag === ReactFiberTag.HostRoot) {
				root = (node as FiberRoot).stateNode;
				break;
			}
			node = node.return;
		}
	}
	if (root) {
		// 标记 root 的 pendingTime
		markRootUpdatedAtTime(root, expirationTime);
	}
	return root;
};