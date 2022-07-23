import { ReactRoot } from '@mini/react-dom';
import { SchedulerPriorityLevel } from '@mini/scheduler';

// 表示是否存在需要本次更新的 useEffect 列表, 
let rootDoesHavePassiveEffects = false;
// 表示是否存在上一次更新未执行的 useEffect 列表
let rootWithPendingPassiveEffects: ReactRoot | null = null;
// 未执行的 useEffect 列表优先级
let pendingPassiveEffectsRenderPriority = SchedulerPriorityLevel.NoSchedulerPriority;

export const getRootDoesHavePassiveEffects = () => {
	return rootDoesHavePassiveEffects;
};

export const setRootDoesHavePassiveEffects = (havePassiveEffects: boolean) => {
	rootDoesHavePassiveEffects = havePassiveEffects;
};

export const getRootWithPendingPassiveEffects = () => {
	return rootWithPendingPassiveEffects;
};

export const setRootWithPendingPassiveEffects = (pendingPassiveEffects: ReactRoot | null) => {
	rootWithPendingPassiveEffects = pendingPassiveEffects;
};

export const getPendingPassiveEffectsRenderPriority = () => {
	return pendingPassiveEffectsRenderPriority;
};

export const setPendingPassiveEffectsRenderPriority = (priorityLevel: SchedulerPriorityLevel) => {
	pendingPassiveEffectsRenderPriority = priorityLevel;
};