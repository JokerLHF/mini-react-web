import { ReactElement, ReactNode } from '@mini/react';
import { isArray, isObject, isText } from '@mini/shared';
import { FiberNode } from '../ReactFiber';
import { reconcileChildrenArray } from './reconcileArrayChildren';
import { reconcileSingleElementChild } from './reconcileElementChild';
import { reconcileSingleTextChild } from './reconcileTextChild';

let isTrackSideEffects = true;
export const shouldTrackSideEffects = () => {
	return isTrackSideEffects;
};

const ChildReconciler = (trackSideEffects: boolean) => {
	/**
   * 根据 newChild 的类型生成对于的 fiber 节点, 对于 null 或者 undefined 直接返回 null，不渲染成 fiber 节点
   */
	const reconcileChildFibers = (returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: ReactNode, renderExpirationTime: number): FiberNode | null => {
		isTrackSideEffects = trackSideEffects;
		if (isObject(newChild)) {
			return reconcileSingleElementChild(returnFiber, currentFirstChild, newChild as ReactElement, renderExpirationTime);
		} else if (isArray(newChild)) {
			return reconcileChildrenArray(returnFiber, currentFirstChild, newChild as ReactNode[], renderExpirationTime);
		} else if (isText(newChild)) {
			return reconcileSingleTextChild(returnFiber, currentFirstChild, `${newChild}` as string, renderExpirationTime);
		}
		return null;
	};
	return reconcileChildFibers;
};

export const mountChildFibers = ChildReconciler(false);
export const reconcileChildFibers = ChildReconciler(true);



/**
 * 关于 fiber 的 index 的一些总结：默认创建 fiber 节点 index 都是0，
 *  在 mount 阶段，
 *      单节点都会是0，多节点根据 数组的index
 *  在 update 阶段，
 *    如果是单节点，在旧节点中找到可以复用的节点，useFiberAsSingle，index都会被重置为0。找不到复用默认创建 index = 0
 *    多节点会根据当前 新节点在 newChildren 的位置作为 index
 */