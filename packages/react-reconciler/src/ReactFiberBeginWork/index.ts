import { ReactMemoElement, ReactNode } from '@mini/react';
import shallowEqual from '@mini/shared/src/shallowEqual';
import { FunctionComponent, ReactFiberTag, ReactFragmentProps, ReactNormalFiberProps } from '../interface/fiber';
import { mountChildFibers, reconcileChildFibers } from '../ReactChildFiber';
import { FiberNode } from '../ReactFiber';
import { ReactExpirationTime } from '../ReactFiberExpirationTime/interface';
import { renderWithHooks } from '../ReactFiberHook';
import { markRef } from '../ReactFiberHook/useRef';
import { getRenderExpirationTime } from '../ReactFiberWorkLoop/const';
import { processUpdateQueue } from '../ReactUpdateQueue';
import { getWorkInProgressDidUpdate, setWorkInProgressDidUpdate } from './const';
import { bailoutHooks, bailoutOnAlreadyFinishedWork } from './helper';

const reconcileChildren = (current: FiberNode | null, workInProgress: FiberNode, nextChildren: ReactNode, renderExpirationTime: number) => {
	// mount 阶段只有 root 节点存在 current
	// update 阶段就要看是否存在子节点
	if (current) {
		workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderExpirationTime);
	} else {
		workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
	}
};

const updateHostRoot = (current: FiberNode, workInProgress: FiberNode, renderExpirationTime: number) => {
	// 消费 hostRoot 的 update 得到最新的 state
	processUpdateQueue(workInProgress);

	const nextState = workInProgress.memoizedState as Record<string, any>;
	const nextChildren = nextState.element;

	// 上一次渲染使用的state， 初次渲染时为null
	const prevState = current.memoizedState;
	const prevChildren = prevState ? (prevState as Record<string, any>).element : null;

	/**
   * 性能优化路径：对于一个组件是否更新取决于两个：props 以及 state 是否都改变。
   * 在 render 前（beginWork）已经通过 props 判断是否需要更新，去修改 didReceiveUpdate 的值
   * 在 render 后 (processUpdateQueue) ，判断 state 是否改变（对于 fiberRoot 来说就是 children 就是绑定在 updateQueue 中，相当于 state）去修改 didReceiveUpdate 的值
   * 只有当 props 以及 state 都没有改变， didReceiveUpdate 才等于 false。任何一个改变了都是 true
   */

	/**
   * 那么对于 FiberRoot 什么时候 props 和 state 会改变呢？
   * 对于 props 永远不会改变：
   *    因为无论是在 ReactRoot 创建 FiberRoot 或者 prepareFreshStack 去 cloneFiberRoot 的时候 props 都是 null
   * 对于 state，也就是 ReactDom.render(element, root) 的 element：
   *    在首次渲染的时候，并没有消费 current 的 updateQueue，所以 prevState 是 null, nextState 是存在，所以会走协调子节点
   *    在更新渲染的时候，prevState 和 nextState 都是一样的，所以会走 bailout
   */
	if (prevChildren === nextChildren) {
		return bailoutOnAlreadyFinishedWork(workInProgress, renderExpirationTime);
	}

	reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
	return workInProgress.child;
};

const updateHostComponent = (current: FiberNode | null, workInProgress: FiberNode, renderExpirationTime: number) => {
	const nextProps = workInProgress.pendingProps as ReactNormalFiberProps;
	const nextChildren = (nextProps as ReactNormalFiberProps).children;

	markRef(current, workInProgress);
	reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
	return workInProgress.child;
};

/**
 * 对于 FunctionComponent fiber 来说，需要执行获取 children
 */
const updateFunctionComponent = (current: FiberNode | null, workInProgress: FiberNode, Component: FunctionComponent, nextProps: ReactNormalFiberProps, renderExpirationTime: number) => {
	const children = renderWithHooks(current, workInProgress, Component, nextProps);
	/**
   * 性能优化路径：
   * 对于一个组件是否更新取决于两个：props 以及 state 是否都改变。
   * 在 render 前（beginWork）已经通过 props 判断是否需要更新，去修改 didReceiveUpdate 的值
   * 在 render 后 (renderWithHooks) 会通过执行 hook 计算 state 是否改变判断是否更新，去修改 didReceiveUpdate 的值
   * 只有当 props 以及 state 都没有改变， didReceiveUpdate 才等于 false。任何一个改变了都是 true
   */
	if (current && !getWorkInProgressDidUpdate()) {
		bailoutHooks(current, workInProgress, renderExpirationTime);
		return bailoutOnAlreadyFinishedWork(workInProgress, renderExpirationTime);
	}

	reconcileChildren(current, workInProgress, children, renderExpirationTime);
	return workInProgress.child;
};

const updateFragment = (current: FiberNode | null, workInProgress: FiberNode, renderExpirationTime: number) => {
	const nextChildren = workInProgress.pendingProps as ReactFragmentProps;
	reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
	return workInProgress.child;
};

const updateMemoComponent = (current: FiberNode | null, workInProgress: FiberNode, Component: ReactMemoElement, nextProps: ReactNormalFiberProps, renderExpirationTime: number) => {  
	// update
	if (current !== null) {
		const oldProps = current.pendingProps as ReactNormalFiberProps;
		const compare = Component.compare || shallowEqual;
		if (compare(oldProps, nextProps)) {
			setWorkInProgressDidUpdate(false);
			return bailoutOnAlreadyFinishedWork(workInProgress, renderExpirationTime);
		}
	}

	// mount
	return updateFunctionComponent(current, workInProgress, Component.type, nextProps, renderExpirationTime);
};

/**
 * beginWork 的任务就是将 workInprogress 的子节点变为 fiber 节点。
 */
export const beginWork = (current: FiberNode | null, workInProgress: FiberNode): FiberNode | null => {
	const updateExpirationTime = workInProgress.expirationTime;
	const renderExpirationTime = getRenderExpirationTime();

	// update时，可以复用current（即上一次更新的Fiber节点）
	if (current) {
		const oldProps = current.pendingProps;
		const newProps = workInProgress.pendingProps;
		if (oldProps !== newProps) {
			setWorkInProgressDidUpdate(true);
		} else if (updateExpirationTime < renderExpirationTime) {
			// 当前fiber的优先级比较低, 就不需要调度
			setWorkInProgressDidUpdate(false);
			return bailoutOnAlreadyFinishedWork(workInProgress, renderExpirationTime);
		} else {
			setWorkInProgressDidUpdate(false);
		}
	} else {
		setWorkInProgressDidUpdate(false);
	}

	workInProgress.expirationTime = ReactExpirationTime.NoWork;
	// mount时：根据tag不同，创建不同的子Fiber节点
	switch (workInProgress.tag) {
	case ReactFiberTag.HostRoot:
		// hostRoot 的 current 肯定存在
		return updateHostRoot(current!, workInProgress, renderExpirationTime);
	case ReactFiberTag.HostComponent:
		return updateHostComponent(current, workInProgress, renderExpirationTime);
	case ReactFiberTag.FunctionComponent: {
		const { pendingProps, type } = workInProgress;
		return updateFunctionComponent(current, workInProgress, type as FunctionComponent, pendingProps as ReactNormalFiberProps, renderExpirationTime);
	}
	case ReactFiberTag.Fragment:
		return updateFragment(current, workInProgress, renderExpirationTime);
	case ReactFiberTag.MemoComponent: {  
		const { pendingProps, type } = workInProgress;
		return updateMemoComponent(current, workInProgress, type as ReactMemoElement, pendingProps as ReactNormalFiberProps, renderExpirationTime);
	}
	case ReactFiberTag.HostText: // 文本节点不可能有子节点，直接返回null
	default:
		return null;
	}
};