import { ensureRootIsScheduled, performUnitOfWork, prepareFreshStack } from "./index";
import { ReactRoot } from "../../react-dom/ReactRoot";
import { commitRoot } from "../ReactFiberCommitWork";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";
import { getExecutionContext, getRenderExpirationTime, getWorkInProgress, setExecutionContext, setWorkInProgress } from "./const";
import { ReactContext } from "./interface";
import { flushPassiveEffects } from "../ReactFiberCommitWork/commitBeforeMutationEffects";

const workLoopSync = () => {
  let workInProgress = getWorkInProgress();
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
    setWorkInProgress(workInProgress);
  }
}

export const performSyncWorkOnRoot = (root: ReactRoot) => {
  const lastExpiredTime = root.lastExpiredTime;
  const expirationTime = lastExpiredTime !== ReactExpirationTime.NoWork ? lastExpiredTime : ReactExpirationTime.Sync;

  flushPassiveEffects();

  if (expirationTime !== getRenderExpirationTime()) {
    prepareFreshStack(root, expirationTime);
  }

  if (getWorkInProgress()) {
    // render 阶段
    const prevExecutionContext = getExecutionContext();
    setExecutionContext(ReactContext.RenderContext);
    workLoopSync();
    setExecutionContext(prevExecutionContext);
  
    root.finishedExpirationTime = expirationTime;
    // render阶段结束，进入commit阶段
    commitRoot(root);

    // 重新调度一次
    ensureRootIsScheduled(root);
  }
  return null;
}
