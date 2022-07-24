import { ReactFiberSideEffectTags } from '../interface/fiber';
import { cloneChildFibers } from '../ReactChildFiber/helper/cloneChild';
import { FiberNode } from '../ReactFiber';
import { ReactExpirationTime } from '../ReactFiberExpirationTime/interface';

export const bailoutOnAlreadyFinishedWork = (workInProgress: FiberNode, renderExpirationTime: number) => {
	const childExpirationTime = workInProgress.childExpirationTime;

	if (childExpirationTime < renderExpirationTime) {
		// 优化路径，通过childExpirationTime跳过对子孙节点的遍历
		// children没有pending的任务，跳过他们
		return null;
	}
	cloneChildFibers(workInProgress);
	return workInProgress.child;
};


export function bailoutHooks(current: FiberNode, workInProgress: FiberNode, expirationTime: number) {
	workInProgress.updateQueue = current.updateQueue;
	/**
   * 1. fiber 取掉 Update 就不会在 completeWork 时候被收集到 effectList 中
   * 2. fiber 取掉 Passive 表示这个 fiber 没有 useEffect，就不会在 commitPassiveHookEffects 收集执行
   */
	workInProgress.effectTag &= ~(ReactFiberSideEffectTags.Passive | ReactFiberSideEffectTags.Update);

	if (current.expirationTime <= expirationTime) {
		current.expirationTime = ReactExpirationTime.NoWork;
	}
}