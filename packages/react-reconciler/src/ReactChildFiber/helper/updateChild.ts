import { ReactElement, ReactFragment, ReactNode } from '@mini/react';
import { isArray, isObject, isText } from '@mini/shared';
import { FiberNode } from '../../ReactFiber';
import { reuseElementFiber, reuseFragmentFiber, reuseTextFiber } from './reuseChild';

export type remainingChildrenMap = Map<string | number, FiberNode>

/**
 * - 尝试复用旧节点
 *   - key 不同，返回 null
 *   - key 相同，类型相同复用，类型不同新建
 */
export const updateSlot = (returnFiber: FiberNode, oldFiber: FiberNode | null, newChild: ReactNode, renderExpirationTime: number) => {
	if (isText(newChild)) {
		return reuseTextFiber(returnFiber, oldFiber, newChild as string, renderExpirationTime);
	} else if (isObject(newChild)) {
		return reuseElementFiber(returnFiber, oldFiber, newChild as ReactElement, renderExpirationTime);
	} else if (isArray(newChild)) {
		return reuseFragmentFiber(returnFiber, oldFiber, newChild as ReactFragment, renderExpirationTime);
	}
	return null;
};

/**
 * 将 oldFiber 收集到 map, 以 key 作为索引。方便搜索减低复杂度
 */
export const mapRemainingChildren = (currentFirstChild: FiberNode | null): remainingChildrenMap => {
	const existingChildren = new Map();
	let existingChild = currentFirstChild;
	while(existingChild) {
		const key = existingChild.key || existingChild.index;
		existingChildren.set(key, existingChild);
		existingChild = existingChild.sibling;
	}
	return existingChildren;
};

/**
 * 根据 newChildren[index] 的 key 在 existingChildren 中找是否可以复用的
 *   - key 不同，返回 null
 *   - key 相同，类型相同复用，类型不同新建
 */
export const updateFromMap = (existingChildren: remainingChildrenMap, returnFiber: FiberNode, newIdx: number, newChild: ReactNode, renderExpirationTime: number) => {
	if (isText(newChild)) {
		// 文本节点没有key
		const matchedFiber = existingChildren.get(newIdx) || null;
		return reuseTextFiber(returnFiber, matchedFiber, newChild as string, renderExpirationTime);
	} else if (isObject(newChild)) {
		newChild = newChild as ReactElement;
		// 1. 根据 key || index 在 map 中找到可以复用的节点
		const matchedFiber = existingChildren.get(newChild.key || newIdx) || null;
		// 2. 尝试进行复用
		return reuseElementFiber(returnFiber, matchedFiber, newChild, renderExpirationTime);
	} else if (isArray(newChild)) {
		// 1. 根据 key || index 在 map 中找到可以复用的节点
		const matchedFiber = existingChildren.get(newIdx) || null;
		// 2. 尝试进行复用
		return reuseFragmentFiber(returnFiber, matchedFiber, newChild as ReactFragment, renderExpirationTime);
	}
	return null;
};