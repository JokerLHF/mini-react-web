/**
 * 由于 mount 阶段和 update 阶段的hook（useXXX）函数是不同的, 所以全局使用 current 指向不同阶段的 hook(useXXX)
 */

import { Dispatcher } from "../react-reconciler/interface/hook";

interface IDispatcher {
  current: Dispatcher | null,
};

export const ReactCurrentDispatcher: IDispatcher = { current: null };

export const useState = <S>(initialState: S) => {
  return ReactCurrentDispatcher.current!.useState(initialState);
}

