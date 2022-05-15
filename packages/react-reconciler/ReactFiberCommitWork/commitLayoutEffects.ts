import { globalCommitRootVariables } from ".";
import { ReactFiberFunctionComponentUpdateQueue } from "../interface/fiber";
import { ReactHookEffect, ReactHookEffectFlags } from "../interface/hook";
import { FiberNode } from "../ReactFiber";

/**
 * 遍历 effectList
 *  1. 执行当前 useLayoutEffect 的 create 函数
 *  2. 筛选出由 useEffect() 创建的 effect
 */
export const commitLayoutEffects = (nextEffect: FiberNode) => {
  let currentEffect: FiberNode | null = nextEffect;
  while(currentEffect) {    
    // 1. 执行当前 useLayoutEffect 的 create 函数
    const layoutHookEffectTag = ReactHookEffectFlags.HasEffect | ReactHookEffectFlags.Layout;
    commitLayoutHookEffectListMount(layoutHookEffectTag, currentEffect);
    // 2. 筛选出由 useEffect() 创建的 effect
    schedulePassiveEffects(currentEffect);
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

// 筛选出由 useEffect() 创建的 effect
// TODO：这里还是要用 while。因为假设第一个 finishedWork 是一个 div，但是只是 propsUpdate。那么此时就没有 updateQueue
const schedulePassiveEffects = (finishedWork: FiberNode) => {
  const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue | null;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect!;
    do {
      const { next, tag } = effect;
      if (
        (tag & ReactHookEffectFlags.Passive) !== ReactHookEffectFlags.NoEffect && // 表示 tag 中存在 Passive
        (tag & ReactHookEffectFlags.HasEffect) !== ReactHookEffectFlags.NoEffect  // 表示 tag 中存在 HasEffect
      ) {
        // 向`pendingPassiveHookEffectsUnMount`数组内`push`要销毁的effect
        enqueuePendingPassiveHookEffectUnMount(finishedWork, effect);
        // 向`pendingPassiveHookEffectsMount`数组内`push`要执行回调的effect
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      effect = next!;
    } while (effect !== firstEffect);
  }
}

// unmount effects 数组
const enqueuePendingPassiveHookEffectUnMount = (fiber: FiberNode, effect: ReactHookEffect) => {
  globalCommitRootVariables.pendingPassiveHookEffectsUnMount.push(effect, fiber);
}

// mount effects 数组
const enqueuePendingPassiveHookEffectMount = (fiber: FiberNode, effect: ReactHookEffect) => {
  globalCommitRootVariables.pendingPassiveHookEffectsMount.push(effect, fiber);
}
