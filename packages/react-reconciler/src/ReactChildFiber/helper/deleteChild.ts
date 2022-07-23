import { shouldTrackSideEffects } from '../index';
import { ReactFiberSideEffectTags } from '../../interface/fiber';
import { FiberNode } from '../../ReactFiber';

/**
 * 对 childToDelete 标记删除
 */
export const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
	if (!shouldTrackSideEffects()) {
		return;
	}
	/**
   * 为什么要在这里收集 effectList 到父节点，然而其他情况则都是在 completeWork 的时候收集？
   *  1. 无论是 mount 还是 update 我们都是在遍历 workInprogress 树， completeWork 作用是将当前 fiber 子节点的 effectList 拼接到当前 fiber 的 effectList 上
   *  2. 被 delete 都是 current 树的节点，也就是说这些节点不可能被复用作为 workInprogress 树的节点， 所以在 completeWork 是没有办法找到这些被 delete 的节点的
   */
	const last = returnFiber.lastEffect;
	if (last) {
		last.nextEffect = childToDelete;
		returnFiber.lastEffect = childToDelete;
	} else {
		returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
	}
	childToDelete.nextEffect = null;
	childToDelete.effectTag |= ReactFiberSideEffectTags.Delete;
};

/**
 * - 假设存在兄弟节点：oldFiber1 => currentDeleteChild => oldFiber3 => oldFiber4
 * - 这个函数作用在于：删除 currentDeleteChild 以及其向右的兄弟节点. 也就是删除：childToDelete => oldFiber3 => oldFiber4
 */
export const deleteRemainingChildren = (returnFiber: FiberNode, currentDeleteChild: FiberNode | null) => {
	if (!shouldTrackSideEffects()) {
		return;
	}
	let childToDelete = currentDeleteChild;
	while(childToDelete) {
		deleteChild(returnFiber, childToDelete);
		childToDelete = childToDelete.sibling;
	}
	return null;
};