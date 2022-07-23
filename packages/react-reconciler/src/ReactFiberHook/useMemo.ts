import { areHookInputsEqual } from './EffectHook/helper';
import { mountWorkInProgressHook, updateWorkInProgressHook } from './index';

export const mountMemo = <T>(create: () => T, deps?: any[]) => {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const nextValue = create();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
};

export const updateMemo = <T>(create: () => T, deps?: any[]) => {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const prevState = hook.memoizedState;
	if (areHookInputsEqual(nextDeps, prevState[1])) {
		return prevState[0];
	}
	// 前后deps不同
	const nextValue = create();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
};