import { ReactFiberProps, ReactFiberSideEffectTags } from '../../interface/fiber';
import { FiberNode } from '../../ReactFiber';

/**
 * - 克隆 fiber, 并且得到的 fiber 是其父节点的唯一子节点。比如：
 * - oldFiber1 => oldFiber2 => oldFiber3  
 * - newElement
 * - 在 diff 过程中 oldFiber2 可以被复用作为 newElement，所以需要重置 sibling 以及 index
 */
export const useFiberAsSingle = (fiber: FiberNode, pendingProps: ReactFiberProps) => {
	const cloneFiber = createWorkInProgress(fiber, pendingProps);
	cloneFiber.sibling = null;
	cloneFiber.index = 0;
	return cloneFiber;
};

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