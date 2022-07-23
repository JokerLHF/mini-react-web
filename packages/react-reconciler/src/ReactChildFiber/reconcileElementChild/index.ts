import { ReactElement } from '@mini/react';
import { REACT_ELEMENT_TYPE } from '@mini/shared';
import { FiberNode } from '../../ReactFiber';
import { placeSingleChild } from '../helper/placeChild';
import { reconcileSingleElement } from './reconcileSingleChild';

export const reconcileSingleElementChild = (returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: ReactElement, renderExpirationTime: number) => {
	switch (newChild.$$typeof) {
	case REACT_ELEMENT_TYPE: {
		const newFiber = reconcileSingleElement(returnFiber, currentFirstChild, newChild as ReactElement, renderExpirationTime);
		return placeSingleChild(newFiber);
	}
	default:
		return null;
	}
};