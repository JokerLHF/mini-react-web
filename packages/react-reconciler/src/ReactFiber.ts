import { ReactElement, ReactElementKey, ReactElementRef, ReactFragment } from '@mini/react';
import { isFunction, isObject, isString, REACT_FRAGMENT_TYPE, REACT_MEMO_TYPE } from '@mini/shared';
import { ReactFiberMemoizedState, ReactFiberProps, ReactFiberSideEffectTags, ReactFiberStateNode, ReactFiberTag, ReactFiberType, ReactFiberUpdateQueue } from './interface/fiber';
import { ReactExpirationTime } from './ReactFiberExpirationTime/interface';

export class FiberNode {
	tag: ReactFiberTag;
	key: ReactElementKey;
	pendingProps: ReactFiberProps;
	type: ReactFiberType;
	stateNode: ReactFiberStateNode;
	ref: ReactElementRef;

	return: FiberNode | null;
	child: FiberNode | null;
	sibling: FiberNode | null;
	alternate: FiberNode | null;

	memoizedState: ReactFiberMemoizedState;
	updateQueue: ReactFiberUpdateQueue;

	effectTag: ReactFiberSideEffectTags;
	firstEffect: FiberNode | null;
	lastEffect: FiberNode | null;
	nextEffect: FiberNode | null;
	index: number;

	expirationTime: ReactExpirationTime;
	childExpirationTime: ReactExpirationTime;

	constructor(tag: ReactFiberTag, pendingProps: ReactFiberProps = null, key: ReactElementKey = null) {

		/**
     * 作为静态数据
     */
		this.tag = tag;
		this.pendingProps = pendingProps;
		this.type = null;
		this.stateNode = null;
		this.ref = null;

		// diff 默认使用用户定义的 key, 没有使用 index
		this.index = 0;
		this.key = key;

		/**
     *  用于连接其他Fiber节点形成Fiber树
     */
		// 指向父Fiber
		this.return = null;
		// 指向子Fiber
		this.child = null;
		// 指向兄弟Fiber
		this.sibling = null;
		// 指向前一次render的fiber
		this.alternate = null;

		/**
     * 动态数据
     */
		this.memoizedState = null;
		this.updateQueue = null;
		this.effectTag = ReactFiberSideEffectTags.NoEffect;

		// 以下3个变量组成了当前Fiber上保存的effect list
		this.firstEffect = null;
		this.lastEffect = null;
		this.nextEffect = null;


		/**
     * 过期时间（优先级）
     */
		this.expirationTime = ReactExpirationTime.NoWork;
		this.childExpirationTime = ReactExpirationTime.NoWork;
	}
}

export const cloneChildFibers = (workInProgress: FiberNode) => {
	let currentChild = workInProgress.child;
	if (!currentChild) {
		return;
	}

	// clone 第一个 child
	let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
	workInProgress.child = newChild;
	newChild.return = workInProgress;

	// 遍历 clone 兄弟节点
	while(currentChild.sibling) {
		currentChild = currentChild.sibling;
		newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
		newChild.return = workInProgress;
	}

	// TODO：这个是干什么用的？  newChild.sibling = null;
};


// 为 current fiber 创建对应的 alternate fiber
export const createWorkInProgress = (current: FiberNode, pendingProps: ReactFiberProps) => {
	let workInProgress = current.alternate;

	if (!workInProgress) {
		workInProgress = new FiberNode(current.tag, pendingProps, current.key);
		workInProgress.type = current.type;
		workInProgress.stateNode = current.stateNode;

		current.alternate = workInProgress;
		workInProgress.alternate = current;
	} else {
		// reactRoot 此时就存在 workInprogress。所以还是需要对 child sibling 赋值
		workInProgress.pendingProps = pendingProps;
		// 已有alternate的情况重置effect
		workInProgress.effectTag = ReactFiberSideEffectTags.NoEffect;
		workInProgress.firstEffect = null;
		workInProgress.lastEffect = null;
		workInProgress.nextEffect = null;
	}

	workInProgress.child = current.child;
	workInProgress.sibling = current.sibling;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.memoizedState = current.memoizedState;
	workInProgress.ref = current.ref;

	workInProgress.expirationTime = current.expirationTime;
	workInProgress.childExpirationTime = current.childExpirationTime;

	return workInProgress;
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
