import { mountWorkInProgressHook, updateWorkInProgressHook } from '.';
import { ReactHookCallback, ReactHookCallbackDeps, ReactHookCallbackMemorized } from '../interface/hook';
import { areHookInputsEqual } from './EffectHook/helper';

export const mountCallback = (callback: ReactHookCallback, deps?: ReactHookCallbackDeps) => {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	hook.memoizedState = [callback, nextDeps];
	return callback;
};

export const updateCallback = (callback: ReactHookCallback, deps?: ReactHookCallbackDeps) => {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const prevState = hook.memoizedState as ReactHookCallbackMemorized;
	if (areHookInputsEqual(nextDeps, prevState[1])) {
		return prevState[0];
	}
	// 前后deps不同
	hook.memoizedState = [callback, nextDeps];
	return callback;
};
