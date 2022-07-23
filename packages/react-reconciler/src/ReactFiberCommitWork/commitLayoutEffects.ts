import { ReactFiberFunctionComponentUpdateQueue } from '../interface/fiber';
import { ReactHookEffectFlags } from '../interface/hook';
import { FiberNode } from '../ReactFiber';

/**
 * 遍历 effectList
 *  1. 执行当前 useLayoutEffect 的 create 函数
 */
export const commitLayoutEffects = (nextEffect: FiberNode) => {
	let currentEffect: FiberNode | null = nextEffect;
	while(currentEffect) {    
		// 1. 执行当前 useLayoutEffect 的 create 函数
		const layoutHookEffectTag = ReactHookEffectFlags.HasEffect | ReactHookEffectFlags.Layout;
		commitLayoutHookEffectListMount(layoutHookEffectTag, currentEffect);
    
		// 2. 执行 ref 的赋值, hookRef 标志在 markRef 函数中赋值，只有 HostComponent 才有 
		if (currentEffect.effectTag & ReactHookEffectFlags.Ref) {
			commitAttachRef(nextEffect);
		}
		currentEffect = currentEffect.nextEffect;
	}
};


// 执行 useLayoutEffect 的 create 函数
const commitLayoutHookEffectListMount = (flags: ReactHookEffectFlags, finishedWork: FiberNode) => {
	const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue;
	const lastEffect = updateQueue ? updateQueue.lastEffect : null;

	if (lastEffect) {
		const firstEffect = lastEffect.next!;
		let effect = firstEffect;
		do {
			// mount
			if ((effect.tag & flags) === flags) { // 表示 tag 中只存在 flags 
				effect.destroy = effect.create();
			}
			effect = effect.next!;
		} while(effect !== firstEffect);
	}
};

const commitAttachRef = (finishedWork: FiberNode) => {
	const ref = finishedWork.ref;
	if (ref) {
		ref.current = finishedWork.stateNode;
	}
};