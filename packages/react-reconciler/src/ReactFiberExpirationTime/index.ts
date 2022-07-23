import { ReactExpirationTime } from './interface';

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = ReactExpirationTime.Batched - 1;

// 10ms内产生的update有同样的过期时间，这样可以把多个update在一次处理
// 越快过期的 expirationTime 越大
export const msToExpirationTime = (ms: number) => {
	return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
};

export const expirationTimeToMs = (expirationTime: number) => {
	return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
};

/**
 * precision 一个步进值，间隔在 precision 内的2个数字会得到同样的结果
 * 举个例子：假设间隔是10， 那么
 *     0 - 9   得到的结果是 10
 *     10 - 19 得到的结果是 20
 *     20 - 29 得到的结果是 30
 * 
 * |0 相当于向下取整， +1 是为了使得最小结果是 precision，而不是 0
 */
function ceiling(num: number, precision: number) {
	return (((num / precision) | 0) + 1) * precision;
}

/**
 * 这个函数目的有两个：
 *  1. 根据不同优先级增加不同延迟时间，得到新的过期时间
 *  2. 过期时间按照 bucketSizeMs 为间隔 得到新的结果
 * 
 * 这么做也许是为了让非常相近的两次更新得到相同的 expirationTime，
 * 然后在一次更新中完成，相当于一个自动的 batchedUpdates。
 */
function computeExpirationBucket(
	currentExpirationTime: number,
	addExpirationInMs: number,
	bucketSizeMs: number,
) {
	// 当前的 current 其实是一个经过 msToExpirationTime 的 过期时间：  MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
	// 所以其实 MAGIC_NUMBER_OFFSET - currentTime = ms / UNIT_SIZE。也就是 ms 是以 UNIT_SIZE 为单位的，相当于抹平了 10ms 的差距
	// 所以 expirationInMs bucketSizeMs 都需要以 UNIT_SIZE 为单位去计算，相当于抹平了 10ms 的差距
	// 所以最后计算的时候并不需要像 msToExpirationTime 一样再次去抹平 10ms 差距，因为再前面已经抹平了，直接 MAGIC_NUMBER_OFFSET 去减就可以

	const currentExpirationTimeForUniSize = MAGIC_NUMBER_OFFSET - currentExpirationTime;
	const addExpirationTimeForUniSize = addExpirationInMs / UNIT_SIZE;
	const bucketSizeMsForUniSize = bucketSizeMs / UNIT_SIZE;

	return (
		MAGIC_NUMBER_OFFSET -
			ceiling(
				currentExpirationTimeForUniSize + addExpirationTimeForUniSize,
				bucketSizeMsForUniSize,
			)
	);
}

export const LOW_PRIORITY_EXPIRATION = 5000;
export const LOW_PRIORITY_BATCH_SIZE = 250;
export function computeAsyncExpiration(currentTime: number) {
	return computeExpirationBucket(
		currentTime,
		LOW_PRIORITY_EXPIRATION,
		LOW_PRIORITY_BATCH_SIZE,
	);
}

export const HIGH_PRIORITY_EXPIRATION = 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;
export function computeUserBlockingExpiration(currentTime: number) {
	return computeExpirationBucket(
		currentTime,
		HIGH_PRIORITY_EXPIRATION,
		HIGH_PRIORITY_BATCH_SIZE,
	);
}