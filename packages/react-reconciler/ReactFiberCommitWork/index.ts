import { FiberRoot, ReactFiberSideEffectTags } from "../interface/fiber";
import { FiberNode } from "../ReactFiber";
import { commitDelete } from "./commitDelete";
import { commitPlacement } from "./commitPlacement";
import { commitUpdate } from "./commitUpdate";

const { 
  Placement,
  Delete,
  Update
} = ReactFiberSideEffectTags;

const commitMutationEffects = (root: FiberNode, nextEffect: FiberNode | null) => {
  while(nextEffect) {
    const effectTag = nextEffect.effectTag;
    // 只处理 Placement / Update / Deletion，排除其他effectTag干扰
    const primaryEffectTag = effectTag & (Placement | Delete | Update);
    switch (primaryEffectTag) {
      case Placement:
        commitPlacement(nextEffect);
        // 去掉 Placement
        nextEffect.effectTag &= ~Placement;
        break;
      case Delete:
        commitDelete(nextEffect);
         // 去掉 Delete
         nextEffect.effectTag &= ~Delete;
        break;
      case Update:
        commitUpdate(nextEffect);
        // 去掉 Update
        nextEffect.effectTag &= ~Update;
        break;
    }
    nextEffect = nextEffect.nextEffect;
  }
}

export const commitRoot = (root: FiberRoot) => {
  const finishedWork = root.alternate;
  if (!finishedWork || !finishedWork.firstEffect) {
    return null;
  }

  let firstEffect = finishedWork.firstEffect;
  // TODO: before mutation阶段

  // mutation阶段
  try {
    commitMutationEffects(root, firstEffect);
  } catch(e) {
    console.warn('commit mutaion error', e);
  }
}