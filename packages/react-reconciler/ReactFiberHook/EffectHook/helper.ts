import { getCurrentHook, getCurrentlyRenderingFiber, mountWorkInProgressHook, updateWorkInProgressHook } from "../index";
import { ReactFiberFunctionComponentUpdateQueue, ReactFiberSideEffectTags } from "../../interface/fiber"
import { ReactHookEffect, ReactHookEffectCreate, ReactHookEffectDeps, ReactHookEffectDestroy, ReactHookEffectFlags } from "../../interface/hook"

const createFunctionComponentUpdateQueue = (): ReactFiberFunctionComponentUpdateQueue => {
  return {
    lastEffect: null
  };
}

/**
 *  将 effect 对象存储在 fiber.updateQueue.lastEffect 中，形成环形链表
 */
const pushEffect = (tag: ReactHookEffectFlags, create: ReactHookEffectCreate, destroy: ReactHookEffectDestroy, deps: ReactHookEffectDeps) => {
  const currentlyRenderingFiber = getCurrentlyRenderingFiber()!;
  const effect = {
    tag,
    create,
    destroy,
    deps,
    // effect 环形链表，所以 next 是不可能为 null 的, 这里初始化先设置为 null
    next: null,
  } as unknown as ReactHookEffect;

  let componentUpdateQueue = currentlyRenderingFiber.updateQueue as ReactFiberFunctionComponentUpdateQueue;
  if (!componentUpdateQueue) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    componentUpdateQueue.lastEffect = effect.next = effect;
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect!;
    const firstEffect = lastEffect.next!;

    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }

  return effect;
}

export const mountEffectImpl = (fiberEffectTag: ReactFiberSideEffectTags, hookEffectTag: ReactHookEffectFlags, create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const currentlyRenderingFiber = getCurrentlyRenderingFiber()!;

  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    ReactHookEffectFlags.HasEffect | hookEffectTag,
    create,
    undefined,
    nextDeps
  )
}

export const updateEffectImpl = (fiberEffectTag: ReactFiberSideEffectTags, hookEffectTag: ReactHookEffectFlags, create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  const currentHook = getCurrentHook()!;
  if (currentHook) {
    const prevEffect = currentHook.memoizedState as ReactHookEffect;
    destroy = prevEffect.destroy;
    const prevDeps = prevEffect.deps;
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // deps相同，不需要为fiber增加effectTag
      pushEffect(hookEffectTag, create, destroy, nextDeps);
      return;
    }
  }

  const currentlyRenderingFiber = getCurrentlyRenderingFiber()!;
  // 前后deps不同，增加effectTag
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    ReactHookEffectFlags.HasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps
  );
}

export const areHookInputsEqual = (nextDeps: any[] | null, prevDeps: any[] | null) => {
  if (!prevDeps || !nextDeps) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
