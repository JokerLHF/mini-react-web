import { ReactFiberFunctionComponentUpdateQueue, ReactFiberHostComponentUpdateQueue, ReactFiberTag, ReactTextFiberProps } from '../../interface/fiber';
import { ReactHookEffectFlags } from '../../interface/hook';
import { FiberNode } from '../../ReactFiber';
import { patchClass, patchStyle } from '../../ReactFiberCompleteWork/diffProps';

export const commitUpdate = (finishedWork: FiberNode) => {
	switch (finishedWork.tag) {
	case ReactFiberTag.HostComponent:
		updateHostComponent(finishedWork);
		break;
	case ReactFiberTag.HostText:
		updateHostText(finishedWork);
		break;
	case ReactFiberTag.FunctionComponent:
		updateFunctionComponent(finishedWork);
		break;
	default:
		return null;
	}
};

const updateDOMProperties = (instance: HTMLElement, updatePayload: ReactFiberHostComponentUpdateQueue) => {
	for (let i = 0; i < updatePayload.length; i += 2) {
		const propKey = updatePayload[i];
		const propValue = updatePayload[i + 1];
		switch(propKey) {
		case 'className':
			patchClass(instance, propValue);
			break;
		case 'style':
			patchStyle(instance, propValue);
			break;
		default:
			break;
		}
	}
};

const updateHostComponent = (finishedWork: FiberNode) => {
	const instance = finishedWork.stateNode as HTMLElement;
	const updatePayload = finishedWork.updateQueue as ReactFiberHostComponentUpdateQueue;
	if (instance && updatePayload) {
		finishedWork.updateQueue = null;
		updateDOMProperties(instance, updatePayload);
	}
};

const updateHostText = (finishedWork: FiberNode) => {
	const instance = finishedWork.stateNode as Text;
	const newText = finishedWork.pendingProps as ReactTextFiberProps;
	instance.nodeValue = newText;
};

const updateFunctionComponent = (finishedWork: FiberNode) => {
	// 执行上一次 useLayoutEffect 的 destroy 函数
	const layoutHookEffectTag = ReactHookEffectFlags.HasEffect | ReactHookEffectFlags.Layout;
	commitLayoutHookEffectListUnMount(layoutHookEffectTag, finishedWork);
};

// 执行上一次 useLayoutEffect 的 destroy 函数
const commitLayoutHookEffectListUnMount = (flags: ReactHookEffectFlags, finishedWork: FiberNode) => {
	const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue;
	const lastEffect = updateQueue ? updateQueue.lastEffect : null;

	if (lastEffect) {
		const firstEffect = lastEffect.next!;
		let effect = firstEffect;
		do {
			// unmount
			if ((effect.tag & flags) === flags) { // 表示 tag 中只存在 flags 
				effect.destroy && effect.destroy();
				effect.destroy = undefined;
			}
			effect = effect.next!;
		} while(effect !== firstEffect);
	}
};
