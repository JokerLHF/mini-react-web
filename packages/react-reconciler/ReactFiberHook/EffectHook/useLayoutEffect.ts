import { ReactFiberSideEffectTags } from "../../interface/fiber"
import { ReactHookEffectCreate, ReactHookEffectDeps, ReactHookEffectFlags } from "../../interface/hook"
import { mountEffectImpl, updateEffectImpl } from "./helper";

export const mountLayoutEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
  /**
   * fiber 增加 Update 才能在 completeWork 时候被收集到 effectList 中
   */
  const fiberEffectTag = ReactFiberSideEffectTags.Update;
  mountEffectImpl(
    fiberEffectTag,
    ReactHookEffectFlags.Layout, // ReactHookEffectFlags.Layout 是 useLayoutEffect 的标记
    create,
    deps,
  );
}

export const updateLayoutEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
 /**
   * fiber 增加 Update 才能在 completeWork 时候被收集到 effectList 中
   */
  const fiberEffectTag = ReactFiberSideEffectTags.Update;
  updateEffectImpl(
    fiberEffectTag,
    ReactHookEffectFlags.Layout, // ReactHookEffectFlags.Layout 是 useLayoutEffect 的标记
    create,
    deps,
  );
}