import { ReactFiberSideEffectTags } from '../../interface/fiber';
import { ReactHookEffectCreate, ReactHookEffectDeps, ReactHookEffectFlags } from '../../interface/hook';
import { mountEffectImpl, updateEffectImpl } from './helper';

export const mountEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
	/**
   * 1. fiber 增加 Update 才能在 completeWork 时候被收集到 effectList 中
   * 2. fiber 增加 Passive 表示这个 fiber 有 useEffect，才能在 commitPassiveHookEffects 收集执行
   */
	const fiberEffectTag = ReactFiberSideEffectTags.Update | ReactFiberSideEffectTags.Passive;
	mountEffectImpl(
		fiberEffectTag,
		ReactHookEffectFlags.Passive, // ReactHookEffectFlags.Passive 是 useEffect 的标记
		create,
		deps,
	);
};

export const updateEffect = (create: ReactHookEffectCreate, deps?: ReactHookEffectDeps) => {
/**
   * 1. fiber 增加 Update 才能在 completeWork 时候被收集到 effectList 中
   * 2. fiber 增加 Passive 表示这个 fiber 有 useEffect，才能在 commitPassiveHookEffects 收集执行
   */
	const fiberEffectTag = ReactFiberSideEffectTags.Update | ReactFiberSideEffectTags.Passive;
	updateEffectImpl(
		fiberEffectTag,
		ReactHookEffectFlags.Passive, // ReactHookEffectFlags.Passive 是 useEffect 的标记
		create,
		deps,
	);
};