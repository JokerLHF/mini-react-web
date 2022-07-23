import { appendChild } from '@mini/react-dom';
import { ReactFiberSideEffectTags, ReactFiberTag, ReactNormalFiberProps } from '../interface/fiber';
import { FiberNode } from '../ReactFiber';
import { diffProperties, setInitialDOMProperties } from './diffProps';
import { createInstance, precacheFiberNode } from './helper';

/**
 *     div
 *   /      \    
 *  div     com      
 *        /   ｜  \
 *      span com  div
 *            |
 *           123 
 * 
 * appendAllChildren 用于将子DOM节点（chid,child.sibling...）append到创建的DOM节点上（instance）
 * 这样当completeWork递归上去时DOM树其实是从底到顶一层层构建好的，commit阶段只需要把顶层root append到container即可
 * 用上面的例子，workInprogress 是顶部的div，那么实际上只需要将 span 123 div div 这些append到workInprogress就好 对于com可以直接跳过
 */
export const appendAllChildren = (parent: HTMLElement, workInProgress: FiberNode) => {
	let node = workInProgress.child;

	while (node) {
		if (node.tag === ReactFiberTag.HostComponent || node.tag === ReactFiberTag.HostText) {
			appendChild(parent, node.stateNode);
		} else if (node.child) {
			// 这里是考虑到组件的情况： 因为组件没有真实 dom 节点，需要跳过组件遍历其子节点
			node = node.child;
			continue;
		}

		if (node === workInProgress) {
			return;
		}

		// 这里用 while 原因：没有兄弟节点证明这一层已经遍历完了，需要会【回溯】上一层继续遍历。如果上一层依旧没有兄弟节点证明上一层也遍历完了，
		// 就会继续回到上上一层，知道回到 workInprogress
		while (!node.sibling) {
			if (!node.return || node.return === workInProgress) {
				return;
			}
			node = node.return;
		}

		// 有兄弟节点处理兄弟节点
		node = node.sibling;
	}
};

// 比较 newProps 和 oldProps，不同 effectTag 增加 update
const updateHostComponent = (current: FiberNode, workInProgress: FiberNode) => {
	const oldProps = current.pendingProps as ReactNormalFiberProps;
	const newProps = workInProgress.pendingProps as ReactNormalFiberProps;
	if (oldProps === newProps) {
		return;
	}
	const instance = workInProgress.stateNode as HTMLElement;
	const updatePayload = diffProperties(instance, oldProps, newProps);
	if (updatePayload) {
		// updateQueue的处理会在commitWork中进行
		workInProgress.updateQueue = updatePayload;
		workInProgress.effectTag |= ReactFiberSideEffectTags.Update;
	}
};

export const completeHostComponentWork = (current: FiberNode | null, workInProgress: FiberNode) => {
	// fiber复用阶段：同时存在 current 以及 stateNode 表示 fiber 复用了，新建的情况下没有 current 和 stateNode
	if (current && workInProgress.stateNode) {
		updateHostComponent(current, workInProgress);
		precacheFiberNode(workInProgress, workInProgress.stateNode as HTMLElement);
		return;
	}

	// fiber 创建阶段
	const instance = createInstance(workInProgress.type as string);
	appendAllChildren(instance, workInProgress);
	workInProgress.stateNode = instance;
	// 在 dom 上挂载 props，比如注册事件
	setInitialDOMProperties(instance, workInProgress.pendingProps as ReactNormalFiberProps);

	precacheFiberNode(workInProgress, instance);
	return null;
};
