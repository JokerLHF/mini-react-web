import { ReactFiberSideEffectTags } from '../../interface/fiber';
import { FiberNode } from '../../ReactFiber';
import { commitDelete } from '../commitMutationEffects/commitDelete';
import { commitPlacement } from './commitPlacement';
import { commitUpdate } from './commitUpdate';

const { 
	Placement,
	Delete,
	Update,
	PlacementAndUpdate,
} = ReactFiberSideEffectTags;

export const commitMutationEffects = (nextEffect: FiberNode) => {
	let finishedWork: FiberNode | null = nextEffect;
	while(finishedWork) {
		const effectTag = finishedWork.effectTag;
		// 只处理 Placement / Update / Deletion，排除其他effectTag干扰
		const primaryEffectTag = effectTag & (Placement | Delete | Update);
		switch (primaryEffectTag) {
		case Placement:
			commitPlacement(finishedWork);
			// 去掉 Placement
			finishedWork.effectTag &= ~Placement;
			break;
		case Delete:
			commitDelete(finishedWork);
			// 去掉 Delete
			finishedWork.effectTag &= ~Delete;
			break;
		case Update:
			commitUpdate(finishedWork);
			// 去掉 Update
			finishedWork.effectTag &= ~Update;
			break;
		case PlacementAndUpdate:
			// Placement
			commitPlacement(finishedWork);
			finishedWork.effectTag &= ~Placement;
			// Update
			commitUpdate(finishedWork);
			finishedWork.effectTag &= ~Update;
			break;
		}
		finishedWork = finishedWork.nextEffect;
	}
};
