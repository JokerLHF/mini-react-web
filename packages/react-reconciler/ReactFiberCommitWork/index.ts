import { ReactRoot } from "../../react-dom/ReactRoot";
import { getCurrentPriorityLevel } from "../../scheduler";
import { SchedulerPriorityLevel } from "../../scheduler/interface";
import { flushSyncCallbackQueue, runWithPriority } from "../../scheduler/scheduleSyncCallback";
import { FiberNode } from "../ReactFiber";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";
import { getExecutionContext, setExecutionContext } from "../ReactFiberWorkLoop/const";
import { getRemainingExpirationTime, markRootFinishedAtTime } from "../ReactFiberWorkLoop/helper";
import { ReactContext } from "../ReactFiberWorkLoop/interface";
import { commitBeforeMutationEffects, flushPassiveEffects } from "./commitBeforeMutationEffects";
import { commitLayoutEffects } from "./commitLayoutEffects";
import { commitMutationEffects } from "./commitMutationEffects";
import { getRootDoesHavePassiveEffects, getRootWithPendingPassiveEffects, setPendingPassiveEffectsRenderPriority, setRootDoesHavePassiveEffects, setRootWithPendingPassiveEffects } from "./const";


// 包裹一层commitRoot，commit使用Scheduler调度
export const commitRoot = (root: ReactRoot) => {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(SchedulerPriorityLevel.ImmediateSchedulerPriority, commitRootImp.bind(null, root, renderPriorityLevel));
}

export const commitRootImp = (root: ReactRoot) => {
  do {
    // syncCallback会保存在一个内部数组中，在 flushPassiveEffects 中 同步执行完
    // 由于syncCallback的callback是 performSyncWorkOnRoot，可能产生新的 passive effect
    // 所以需要遍历直到rootWithPendingPassiveEffects为空
    flushPassiveEffects();
  } while (getRootWithPendingPassiveEffects() !== null)

  const finishedWork = root.current.alternate;
  if (!finishedWork) {
    return null;
  }

  const renderPriorityLevel = getCurrentPriorityLevel();
  const expirationTime = root.finishedExpirationTime;

  // 重置Scheduler相关
  root.callbackNode = null;
  root.callbackExpirationTime = ReactExpirationTime.NoWork;
  root.callbackPriority = SchedulerPriorityLevel.NoSchedulerPriority;
  root.finishedExpirationTime = ReactExpirationTime.NoWork;

  // 更新root的firstPendingTime，这代表下一个要进行的任务的expirationTime
  const remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(finishedWork);
  markRootFinishedAtTime(root, expirationTime, remainingExpirationTimeBeforeCommit);

  let firstEffect = finishedWork.firstEffect;
  let nextEffect: FiberNode | null = null;

  if (firstEffect) {
    const prevExecutionContext = getExecutionContext();
    setExecutionContext(ReactContext.CommitContext);

    // before mutation阶段
    nextEffect = firstEffect;
    try {
      commitBeforeMutationEffects(nextEffect)
    } catch (e) {
      console.warn('commit before mutation error', e);
    }

    // mutation阶段
    nextEffect = firstEffect;
    try {
      commitMutationEffects(nextEffect);
    } catch(e) {
      console.warn('commit mutation error', e);
    }
  
    // layout 阶段
    nextEffect = firstEffect;
    try {
      commitLayoutEffects(nextEffect);
    } catch(e) {
      console.warn('commit mutation error', e);
    }


    // 本次commit含有useEffect
    if (getRootDoesHavePassiveEffects()) {
      setRootDoesHavePassiveEffects(false);       // 标记没有本次更新需要执行的 useEffect 了
      setRootWithPendingPassiveEffects(root);     // 标记存在未执行的 useEffect，下一次更新之前需要先执行
      setPendingPassiveEffectsRenderPriority(renderPriorityLevel);
    } else {
      // 没有 effect 直接清楚 GC，有 effect 需要等未执行的 useEffect 执行后才能 GC
      nextEffect = firstEffect;
      while (nextEffect) {
        const nextNextEffect: FiberNode | null = nextEffect.nextEffect;
        nextEffect.nextEffect = null;
        nextEffect = nextNextEffect;
      }
    }

    setExecutionContext(prevExecutionContext);
  }

  root.current = finishedWork;
  // useLayout 的 setState 需要同步
  flushSyncCallbackQueue();
}


