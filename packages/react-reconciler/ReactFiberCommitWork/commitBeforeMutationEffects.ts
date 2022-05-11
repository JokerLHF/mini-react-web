import { globalCommitRootVariables } from ".";
import { ReactFiberSideEffectTags } from "../interface/fiber";
import { ReactHookEffect } from "../interface/hook";
import { FiberNode } from "../ReactFiber";

// 遍历 effectList，注册 flushPassiveEffectsImpl
export const commitBeforeMutationEffects = (nextEffect: FiberNode) => {
  /**
   * 如果不用 while：
   *    有可能第一个 nextEffect 是一个 div，但是只是 propsUpdate, effectTag 上没有 Passive，那么此时就不会执行 flushPassive。
   * 所以用 while 遍历 effectList 链表，看是否存在带有 Passive，并且只需要注册一次 flushPassiveEffectsImpl 即可
   */
  let currentEffect: FiberNode | null = nextEffect;
  while(currentEffect) {
    // fiber.effectTag 上存在 Passive，也就是存在 useEffect
    if ((currentEffect.effectTag & ReactFiberSideEffectTags.Passive) !== ReactFiberSideEffectTags.NoEffect) {
      if (!globalCommitRootVariables.rootDoesHavePassiveEffects) {
        globalCommitRootVariables.rootDoesHavePassiveEffects = true;
        setTimeout(() => { // TODO 替换成 scheduler
          flushPassiveEffectsImpl();
        });
      }
    }
    currentEffect = currentEffect.nextEffect;
  }
}

const flushPassiveEffectsImpl = () => {
  // 1. 执行 effect.destroy()
  const unMountEffects = globalCommitRootVariables.pendingPassiveHookEffectsUnMount;
  globalCommitRootVariables.pendingPassiveHookEffectsUnMount = [];
  for (let i = 0; i < unMountEffects.length; i += 2) {
    const effect = unMountEffects[i] as ReactHookEffect;
    const destroy = effect.destroy;
    effect.destroy = undefined;
    if (typeof destroy === 'function') {
      destroy();
    }
  }

  // 2. 执行新 effect.create(), 重新赋值到 effect.destroy
  const mountEffects = globalCommitRootVariables.pendingPassiveHookEffectsMount;
  globalCommitRootVariables.pendingPassiveHookEffectsMount = [];
  for (let i = 0; i < mountEffects.length; i += 2) {
    const effect = mountEffects[i] as ReactHookEffect;
    effect.destroy = effect.create();
  }
}
