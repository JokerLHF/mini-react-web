
import { ReactElementProps } from '@mini/react';
import { isObject, isString } from '@mini/shared';

export const patchClass = (el: HTMLElement, nextPropVal: any) => {
	if (isString(nextPropVal)) {
		el.className = `${nextPropVal}`;
	}
};

export const patchStyle = (el: HTMLElement, nextPropVal: any) => {
	if (isObject(nextPropVal)) {
		for (const key in nextPropVal) {
			el.style[key as any] = nextPropVal[key];
		}
	}
};

// 这里的 props 简单处理后续有余力再看合成事件，现在只支持最简单的事件以及 style className
export const setInitialDOMProperties = (instance: HTMLElement, nextProps: ReactElementProps) => {
	for (const propKey in nextProps) {
		const newProp = nextProps[propKey];
		switch (propKey) {
		case 'className':
			patchClass(instance, newProp);
			break;
		case 'style':
			patchStyle(instance, newProp);
			break;
		default:
			break;
		}
	}
};

export const diffProperties = (instance: HTMLElement, oldProps: ReactElementProps, newProps: ReactElementProps) => {
	let updatePayload: any[] | null = null;
	for (const propKey in newProps) {
		const newProp = newProps[propKey];
		const oldProp = oldProps ? oldProps[propKey] : undefined;
		// 相等或者都不存在
		if (newProp === oldProp || (!newProp && !oldProp)) {
			continue;
		}
		switch (propKey) {
		case 'className': {
			const classUpdates = diffClass(propKey, oldProp, newProp);
			if (classUpdates) {
				(updatePayload = updatePayload || []).push(...classUpdates);
			}
			break;
		}
		case 'style': {
			const styleUpdates = diffStyle(propKey, oldProp, newProp);
			if (styleUpdates) {
				(updatePayload = updatePayload || []).push(...styleUpdates);
			}
			break;
		}
		default:
			break;
		}
	}
	return updatePayload;
};

// class 只考虑是 string
const diffClass = (propKey: string, prevPropVal: any, nextPropVal: any) => {
	if (prevPropVal !== nextPropVal && isString(nextPropVal)) {
		return [propKey, nextPropVal];
	}
	return null;
};

// style 只考虑是 object 的情况
const diffStyle = (propKey: string, prevPropVal: any, nextPropVal: any) => {
	if (prevPropVal !== nextPropVal && isObject(nextPropVal)) {
		return [propKey, nextPropVal];
	}
	return null;
};