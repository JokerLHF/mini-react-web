import { scheduleCallback } from "../../scheduler";
import { SchedulerPriorityLevel } from "../../scheduler/interface";
import { flushSyncCallbackQueue, runWithPriority } from "../../scheduler/scheduleSyncCallback";
import { ReactFiberFunctionComponentUpdateQueue, ReactFiberSideEffectTags, ReactFiberTag } from "../interface/fiber";
import { ReactHookEffect, ReactHookEffectFlags } from "../interface/hook";
import { FiberNode } from "../ReactFiber";
import { getExecutionContext, setExecutionContext } from "../ReactFiberWorkLoop/const";
import { ReactContext } from "../ReactFiberWorkLoop/interface";
import { getPendingPassiveEffectsRenderPriority, getRootDoesHavePassiveEffects, getRootWithPendingPassiveEffects, setPendingPassiveEffectsRenderPriority, setRootDoesHavePassiveEffects, setRootWithPendingPassiveEffects } from "./const";

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
      if (!getRootDoesHavePassiveEffects()) {
        setRootDoesHavePassiveEffects(true);
        scheduleCallback(SchedulerPriorityLevel.NormalSchedulerPriority, flushPassiveEffectsImpl)
      }
    }
    currentEffect = currentEffect.nextEffect;
  }
}

// 遍历effectList执行 passive effect, 并且 GC
const flushPassiveEffectsImpl = () => {
  // 该变量在commitRoot DOM渲染完成后被赋值
  const root = getRootWithPendingPassiveEffects();
  if (!root) {
    return null;
  }
  setRootWithPendingPassiveEffects(null);
  setPendingPassiveEffectsRenderPriority(SchedulerPriorityLevel.NoSchedulerPriority);

  const prevExecutionContext = getExecutionContext();
  setExecutionContext(ReactContext.CommitContext);

  let effect = root.current.firstEffect;
  while (effect) {
    try {
      commitPassiveHookEffects(effect);
    } catch(e) {
      console.warn(e);
    }

    // 这里可以看作是 GC
    const nextNextEffect = effect.nextEffect;
    effect.nextEffect = null;
    effect = nextNextEffect;
  }
  setExecutionContext(prevExecutionContext);
  // TODO: 为什么执行完 useEffect 之后要调用一次 flushSyncCallbackQueue 呢？
  flushSyncCallbackQueue();

  return null;
}

function commitPassiveHookEffects(finishedWork: FiberNode) {
  if ((finishedWork.effectTag & ReactFiberSideEffectTags.Passive) !== ReactFiberSideEffectTags.NoEffect) {
    switch (finishedWork.tag) {
      case ReactFiberTag.FunctionComponent:
        // 遍历updateQueue执行 useEffect unmount函数
        commitHookEffectListUnmount(ReactHookEffectFlags.HasEffect | ReactHookEffectFlags.Passive, finishedWork);
        commitHookEffectListMount(ReactHookEffectFlags.HasEffect | ReactHookEffectFlags.Passive, finishedWork);
        break;
      default:
        break;
    }
  }
}

/**
 * 从 effect 列表中筛选出 useEffect 执行 destroy
 */
function commitHookEffectListUnmount(tag: ReactHookEffectFlags, finishedWork: FiberNode) {
  const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue;
  let lastEffect = updateQueue ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect)
  }
}

/**
 * 从 effect 列表中筛选出 useEffect 执行 create
 */
function commitHookEffectListMount(tag: ReactHookEffectFlags, finishedWork: FiberNode) {
  const updateQueue = finishedWork.updateQueue as ReactFiberFunctionComponentUpdateQueue;
  let lastEffect = updateQueue ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect: ReactHookEffect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // mount
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect)
  }
}

/**
 * 跟 commitBeforeMutationEffects 是以 Normal 优先级调度，去执行 未执行的 useEffect
 * 这个函数没有调度立刻就执行了 未执行的 useEffect
 */
export function flushPassiveEffects() {
  const pendingPassiveEffectsRenderPriority = getPendingPassiveEffectsRenderPriority();
  if (pendingPassiveEffectsRenderPriority !== SchedulerPriorityLevel.NoSchedulerPriority) {
    // passiveEffects 的优先级按 <= NormalPriority
    const priorityLevel = pendingPassiveEffectsRenderPriority > SchedulerPriorityLevel.NormalSchedulerPriority ? SchedulerPriorityLevel.NormalSchedulerPriority : pendingPassiveEffectsRenderPriority;
    setPendingPassiveEffectsRenderPriority(SchedulerPriorityLevel.NoSchedulerPriority);
    return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
  }
}