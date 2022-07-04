import { ReactFiberFunctionComponentUpdateQueue } from "../interface/fiber";
import { ReactHookEffectFlags } from "../interface/hook";
import { FiberNode } from "../ReactFiber";

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
    currentEffect = currentEffect.nextEffect;
  }
}


// 执行 useLayoutEffect 的 create 函数
const commitLayoutHookEffectListMount = (flags: ReactHookEffectFlags, finishedWork: FiberNode) => {
  const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue;
  let lastEffect = updateQueue ? updateQueue.lastEffect : null;

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
}