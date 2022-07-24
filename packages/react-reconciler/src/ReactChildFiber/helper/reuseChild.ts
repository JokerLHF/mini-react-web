import { ReactElement, ReactFragment } from '@mini/react';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from '@mini/shared';
import { ReactFiberTag } from '../../interface/fiber';
import { FiberNode } from '../../ReactFiber';
import { useFiberAsSingle } from './cloneChild';
import { createFiberFromElement, createFiberFromFragment, createFiberFromText, } from './createChild';
import { placeSingleChild } from './placeChild';

/**
 * - 文本节点尝试复用旧节点
 *   - key 不同，返回 null
 *   - key 相同，类型相同复用，类型不同新建
 */
export const reuseTextFiber = (returnFiber: FiberNode, oldFiber: FiberNode | null, textContent: string, renderExpirationTime: number) => {
	// 文本节点是没有 key 的，如果之前的 fiber 节点存在 key 就证明之前 oldFiber 不是文本节点，但是现在是文本节点 无法复用
	if (oldFiber?.key !== null) {
		return null;
	}
  
	// key，type相同，复用节点
	if (oldFiber && oldFiber.tag === ReactFiberTag.HostText) { // 在写 jsx 的时候文本节点是没有办法自定义 key 的。所以文本节点只能通过 tag 去判断
		const existing = useFiberAsSingle(oldFiber,  textContent);
		existing.return = returnFiber;
		return existing;
	}

	// key相同，type不同，新建节点
	const created = createFiberFromText(textContent, renderExpirationTime);
	created.return = returnFiber;
	return placeSingleChild(created);
};

/**
 * - react对象节点尝试复用旧节点
 *   - key 不同，返回 null
 *   - key 相同，类型相同复用，类型不同新建
 */
export const reuseElementFiber = (returnFiber: FiberNode, oldFiber: FiberNode | null, newChild: ReactElement, renderExpirationTime: number) => {
	switch(newChild.$$typeof) {
	case REACT_ELEMENT_TYPE:
		// key 不同直接返回
		if (newChild.key !== oldFiber?.key) {
			return null;
		}

		// key 相同尝试复用
		return oldFiber.type === REACT_FRAGMENT_TYPE
			? reuseFragmentFiber(returnFiber, oldFiber, (newChild as ReactElement).props.children, renderExpirationTime)
			: reuseElement(returnFiber, oldFiber, newChild, renderExpirationTime);
	default:
		return null;
	}
};

const reuseElement = (returnFiber: FiberNode, oldFiber: FiberNode | null, element: ReactElement, renderExpirationTime: number) => {
	// key，type相同，复用节点
	if (oldFiber && oldFiber.type === element.type) {
		const existing = useFiberAsSingle(oldFiber, element.props);
		existing.return = returnFiber;
		return existing;
	}
	// key相同，type不同，新建节点
	const created = createFiberFromElement(element, renderExpirationTime);
	created.return = returnFiber;
	return created;
};

export const reuseFragmentFiber = (returnFiber: FiberNode, oldFiber: FiberNode | null, element: ReactFragment, renderExpirationTime: number) => {
	// key，type相同，复用节点
	if (oldFiber && oldFiber.tag === ReactFiberTag.Fragment) {
		const existing = useFiberAsSingle(oldFiber, element);
		existing.return = returnFiber;
		return existing;
	}
	// key相同，type不同，新建节点
	const created = createFiberFromFragment(element, renderExpirationTime);
	created.return = returnFiber;
	return created;
};