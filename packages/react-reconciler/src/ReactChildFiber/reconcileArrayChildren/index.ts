import { shouldTrackSideEffects } from '../index';
import { ReactNode } from '@mini/react';
import { FiberNode } from '../../ReactFiber';
import { deleteChild, deleteRemainingChildren } from '../helper/deleteChild';
import { placeChild } from '../helper/placeChild';
import { createChild } from '../helper/createChild';
import { mapRemainingChildren, updateFromMap, updateSlot } from '../helper/updateChild';

export const reconcileChildrenArray = (returnFiber: FiberNode,  currentFirstChild: FiberNode | null, newChildren: ReactNode[], renderExpirationTime: number) => {
	// 遍历到的 newChild 索引
	let newIdx = 0;
	let lastPlacedIndex = 0;

	// 遍历过程中用于比较的 oldFiber
	let oldFiber = currentFirstChild;
	let nextOldFiber: FiberNode | null = null;

	// diff 完成后新的第一个child
	let resultingFirstChild: FiberNode | null = null;
	let previousNewFiber: FiberNode | null = null;

	/**
   * 第一轮遍历，遍历 newChildren 数组，尝试复用 oldFiber。遇到无法复用就停止进入下一轮遍历
   *   oldFiber1 => oldFiber2 => oldFiber3 => oldFiber4
   *   [newChild1, newChild2, newChild3]
   */
	for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
		/**
     * 1. 纠正 oldFiber：在 reconcileChildrenArray 时会遍历 children 转换为 fiber，并且 fiber 的 index 为数组对应的下标。
     * mount 阶段是：  [null, a] ， 其中 a.index === 1。 
     *   对于 null react 不会转换为 fiber 并且渲染的
     * update 阶段是： [b, a] ，则实际上 diff 应该顺序应该 null -> b   a -> a。
     *   但是因为对于 null react不会转换为 fiber 并且渲染的，所以此时的 currentFirstChild 是 a，所以需要做修正
     */
		if (oldFiber.index > newIdx) {
			nextOldFiber = oldFiber;
			oldFiber = null;
		} else {
			nextOldFiber = oldFiber.sibling;
		}

		/**
     * 2. 尝试复用旧节点
     */
		const newFiber = updateSlot(
			returnFiber,
			oldFiber,
			newChildren[newIdx],
			renderExpirationTime,
		);
    
		// 2.1 key 不同复用不了直接停止第一轮循环
		if (newFiber === null) {
			// 对应上面纠正 oldFiber，这里恢复回去
			if (oldFiber === null) {
				oldFiber = nextOldFiber;
			}
			break;
		}

		// 2.2 key 相同但是 type 不同，新建节点。新建的节点没有 alternate 属性
		if (shouldTrackSideEffects()) {
			// ex：oldFiber: <div key="1"></div> newFiber: <p key="1"></p>
			// 新旧 fiber key 相同，但是 type 不同，所以是创建新fiber，没有对应 alternate。应该删除旧节点
			if (oldFiber && !newFiber.alternate) {
				deleteChild(returnFiber, oldFiber);
			}
		}
		// 2.3 key，type 都相同可复用，插入可复用的fiber，返回插入的索引
		newFiber.index = newIdx;
		lastPlacedIndex = placeChild(newFiber, lastPlacedIndex);

		/**
     * 3. 将最终的 child fiber 链接成链表
     */
		if (!previousNewFiber) {
			previousNewFiber = resultingFirstChild = newFiber;
		} else {
			previousNewFiber.sibling = newFiber;
			previousNewFiber = newFiber;
		}

		/**
     * 4. 继续尝试复用下一个旧节点
     */
		oldFiber = nextOldFiber;
	}

	/**
   * 第二轮遍历：新节点遍历完了，如果还存在旧节点，此时应该删除旧节点
   */
	if (newIdx === newChildren.length) {
		deleteRemainingChildren(returnFiber, oldFiber);
		return resultingFirstChild;
	}

	/**
   * 第三轮遍历: 旧节点遍历完了，如果还存在新节点，此时应该新建新节点
   * mount 阶段也会走这个逻辑
   */
	if (!oldFiber) {
		for (; newIdx < newChildren.length; newIdx++) {
			/**
       *  1. 新建 fiber 节点
       */
			const newFiber = createChild(returnFiber, newChildren[newIdx], renderExpirationTime);
			if (newFiber === null) {
				continue;
			}
			/**
       * 2. 插入可复用的 fiber，返回对应的索引
       */
			newFiber.index = newIdx;
			lastPlacedIndex = placeChild(newFiber, lastPlacedIndex);
			/**
       * 3. 将最终的 child fiber 链接成链表
       */
			if (!previousNewFiber) {
				previousNewFiber = resultingFirstChild = newFiber;
			} else {
				previousNewFiber.sibling = newFiber;
				previousNewFiber = newFiber;
			}
		}
		return resultingFirstChild;
	}

	/**
   * 第四轮遍历: 新节点和旧节点都没有遍历完
   * 将所有未遍历的oldFiber存入map，这样在接下来的遍历中能O(1)的复杂度就能通过key找到对应的oldFiber
   */
	const existingChildren = mapRemainingChildren(oldFiber);
	for (; newIdx < newChildren.length; newIdx++) {
		const newFiber = updateFromMap(
			existingChildren,
			returnFiber,
			newIdx,
			newChildren[newIdx],
			renderExpirationTime,
		);
		// 找到节点，就在 existingChildren 中删除掉该节点，
		if (newFiber) {
			if (shouldTrackSideEffects() && newFiber.alternate) {
				// 存在current，代表我们需要复用这个节点，将对应oldFiber从map中删除
				// 这样该oldFiber就不会置为删除
				existingChildren.delete(newFiber.key || newIdx);
			}

			newFiber.index = newIdx;
			lastPlacedIndex = placeChild(newFiber, lastPlacedIndex);

			if (!previousNewFiber) {
				previousNewFiber = resultingFirstChild = newFiber;
			} else {
				previousNewFiber.sibling = newFiber;
				previousNewFiber = newFiber;
			}
		}
	}
	return resultingFirstChild;
};