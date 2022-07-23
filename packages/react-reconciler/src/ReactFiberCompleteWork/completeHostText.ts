import { ReactFiberSideEffectTags, ReactTextFiberProps } from '../interface/fiber';
import { FiberNode } from '../ReactFiber';
import { createTextInstance, precacheFiberNode } from './helper';

/**
 *  对比新旧 text，不同 effectTag 增加 update
 */
const updateHostText = (workInProgress: FiberNode, newText: string, oldText: string) => {
	if (newText !== oldText) {
		workInProgress.effectTag |= ReactFiberSideEffectTags.Update;
	}
};

export const completeHostTextWork = (current: FiberNode | null, workInProgress: FiberNode) => {
	// fiber复用阶段：同时存在 current 以及 stateNode 表示 fiber 复用了，新建的情况下没有 current 和 stateNode
	if (current && workInProgress.stateNode) {
		const newText = current.pendingProps as ReactTextFiberProps;
		const oldText = workInProgress.pendingProps as ReactTextFiberProps;
		updateHostText(workInProgress, newText, oldText);
		precacheFiberNode(workInProgress, workInProgress.stateNode as Text);
		return;
	}

	// fiber 创建阶段
	workInProgress.stateNode = createTextInstance(workInProgress.pendingProps as ReactTextFiberProps);
	precacheFiberNode(workInProgress, workInProgress.stateNode as Text);
};
