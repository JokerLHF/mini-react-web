import { ReactRoot } from "../../react-dom/ReactRoot";
import { FiberRoot } from "../interface/fiber";
import { ReactHookEffect } from "../interface/hook";
import { FiberNode } from "../ReactFiber";
import { commitBeforeMutationEffects } from "./commitBeforeMutationEffects";
import { commitLayoutEffects } from "./commitLayoutEffects";
import { commitMutationEffects } from "./commitMutationEffects";

/**
 * 在React中commitWork中大部分逻辑是杂糅在 workLoop 中的，我将他们抽离到commitWork
 * 为了逻辑抽离这里写成公共全局变量
 */
interface IGlobalCommitRootVariables {
  pendingPassiveHookEffectsUnMount: (ReactHookEffect | FiberNode)[],
  pendingPassiveHookEffectsMount: (ReactHookEffect | FiberNode)[],
  rootDoesHavePassiveEffects: boolean,
}

export const globalCommitRootVariables: IGlobalCommitRootVariables = {
  pendingPassiveHookEffectsUnMount: [],
  pendingPassiveHookEffectsMount: [],
  rootDoesHavePassiveEffects: false,
}

export const commitRoot = (reactRoot: ReactRoot) => {
  const finishedWork = reactRoot.current.alternate;
  if (!finishedWork?.firstEffect) {
    return null;
  }

  let firstEffect = finishedWork.firstEffect;
  let nextEffect: FiberNode | null = null;

  // before mutation阶段
  try {
    commitBeforeMutationEffects(firstEffect)
  } catch (e) {
    console.warn('commit before mutation error', e);
  }

  // mutation阶段
  try {
    commitMutationEffects(firstEffect);
  } catch(e) {
    console.warn('commit mutation error', e);
  }

  // layout 阶段
  try {
    commitLayoutEffects(firstEffect);
  } catch(e) {
    console.warn('commit mutation error', e);
  }

  // 修改 current 树
  reactRoot.current = finishedWork;

  // ============ 渲染后: 断开effectList，方便垃圾回收 ============
  // TODO: 这里不太明白为什么 【本次commit含有useEffect】 就不需要断开 effectList 了？？？
  if (globalCommitRootVariables.rootDoesHavePassiveEffects) {
    // 本次commit含有useEffect
    globalCommitRootVariables.rootDoesHavePassiveEffects = false;
  } else {
    nextEffect = firstEffect;
    while (nextEffect) {
      const nextNextEffect: FiberNode | null = nextEffect.nextEffect;
      nextEffect.nextEffect = null;
      nextEffect = nextNextEffect;
    }
  }
}

/**
 * TOThink：effect 上的 hasEffect 这个标记好像没有什么用？？？？
 */