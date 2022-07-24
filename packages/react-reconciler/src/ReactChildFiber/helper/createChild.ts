import { ReactElement, ReactFragment, ReactNode } from '@mini/react';
import { FiberNode } from '../../ReactFiber';
import { REACT_ELEMENT_TYPE, isFunction, isArray, isText, isObject, isString, REACT_FRAGMENT_TYPE, REACT_MEMO_TYPE } from '@mini/shared';
import { ReactFiberTag } from '../../interface/fiber';

export const createChild = (returnFiber: FiberNode, newChild: ReactNode, renderExpirationTime: number) => {
	if (isObject(newChild)) {
		return createElementFiber(returnFiber, newChild as ReactElement, renderExpirationTime);
	} else if (isText(newChild)) {
		const created = createFiberFromText(newChild as string, renderExpirationTime);
		created.return = returnFiber;
		return created;
	} else if (isArray(newChild)) {
		const created = createFiberFromFragment(newChild as ReactFragment, renderExpirationTime);
		created.return = returnFiber;
		return created;
	}
	return null;
};

/**
 * 根据 object 类型创建对应的 fiber
 */
export const createElementFiber = (returnFiber: FiberNode, newChild: ReactElement, renderExpirationTime: number) => {
	switch(newChild.$$typeof) {
	case REACT_ELEMENT_TYPE: {
		const created = createFiberFromElement(newChild, renderExpirationTime);
		created.return = returnFiber;
		return created;
	}
	default:
		return null;
	}
};


export const createFiberFromElement = (element: ReactElement, renderExpirationTime: number) => {
	const { type, key, props } = element;
	let tag;
	getTag: switch (type) {
	case REACT_FRAGMENT_TYPE:
		return createFiberFromFragment(element.props.children, renderExpirationTime);
	default: {
		if (isFunction(type)) {
			tag = ReactFiberTag.FunctionComponent;
			break;
		} else if (isString(type)) {
			tag = ReactFiberTag.HostComponent;
			break;
		} else if (isObject(type)) {
			// 目前只有 ReactMemo 就直接 any 了
			switch ((type as any).$$typeof) {
			case REACT_MEMO_TYPE:
				tag = ReactFiberTag.MemoComponent;
				break getTag;
			}
		}
		throw Error('出错了');
	}
	}

	const fiber = new FiberNode(tag, props, key);
	fiber.expirationTime = renderExpirationTime;
	fiber.type = type;
	fiber.ref = element.ref;
	return fiber;
};

export const createFiberFromText = (textContent: string, renderExpirationTime: number) => {
	const fiber = new FiberNode(ReactFiberTag.HostText, textContent);
	fiber.expirationTime = renderExpirationTime;
	return fiber;
};

export const createFiberFromFragment = (element: ReactFragment, renderExpirationTime: number) => {
	const fiber = new FiberNode(ReactFiberTag.Fragment, element, null);
	fiber.expirationTime = renderExpirationTime;
	fiber.type = REACT_FRAGMENT_TYPE;
	return fiber;
};
