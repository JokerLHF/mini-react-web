import { ReactElementKey, ReactElementRef } from '@mini/react';
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