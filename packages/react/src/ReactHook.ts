/**
 * 由于 mount 阶段和 update 阶段的hook（useXXX）函数是不同的, 所以全局使用 current 指向不同阶段的 hook(useXXX)
 */

import { Dispatcher, ReactHookCallback, ReactHookCallbackDeps, ReactHookEffectCreate, ReactHookEffectDeps } from "@mini/react-reconciler";

interface IDispatcher {
  current: Dispatcher | null,
};

export const ReactCurrentDispatcher: IDispatcher = { current: null };

export const useState = <S>(initialState: S) => {
  return ReactCurrentDispatcher.current!.useState(initialState);
}

export const useEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
  return ReactCurrentDispatcher.current!.useEffect(create, deps);
}

export const useLayoutEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
  return ReactCurrentDispatcher.current!.useLayoutEffect(create, deps);
}

export const useCallback = (callback: ReactHookCallback, deps?: ReactHookCallbackDeps) => {
  return ReactCurrentDispatcher.current!.useCallback(callback, deps);
}

export const useRef = <T>(initialValue: T) => {
  return ReactCurrentDispatcher.current!.useRef(initialValue);
}
