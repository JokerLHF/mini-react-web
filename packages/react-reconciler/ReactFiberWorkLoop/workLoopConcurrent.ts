import { ensureRootIsScheduled, performUnitOfWork, prepareFreshStack } from "./index";
import { ReactRoot } from "../../react-dom/ReactRoot";
import { shouldYieldToHost } from "../../scheduler";
import { SchedulerCallback } from "../../scheduler/interface";
import { commitRoot } from "../ReactFiberCommitWork";
import { flushPassiveEffects } from "../ReactFiberCommitWork/commitBeforeMutationEffects";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";
import { requestCurrentTimeForUpdate, setCurrentEventTime } from "../ReactFiberExpirationTime/updateExpirationTime";
import { getExecutionContext, getRenderExpirationTime, getWorkInProgress, setExecutionContext, setWorkInProgress } from "./const";
import { getNextRootExpirationTimeToWorkOn, markRootExpiredAtTime } from "./helper";
import { ReactContext } from "./interface";

const workLoopConcurrent = () => {
  while (getWorkInProgress() && shouldYieldToHost()) {
    const nextWorkInprogress = performUnitOfWork(getWorkInProgress()!);
    setWorkInProgress(nextWorkInprogress);
  }
}

export const performConcurrentWorkOnRoot = (root: ReactRoot, didUserCallbackTimeout: boolean): null | SchedulerCallback => {
  setCurrentEventTime(ReactExpirationTime.NoWork);
  /**
   * 这里为什么会导致 scheduler 过期呢？举个例子：onDrag 的时候去 setState 随后 dom 渲染最新的坐标
   * 因为 scheduler 是用宏任务，保存在宏任务队列中， onDrag 这个回调函数也是宏任务，保存在宏任务队列中
   * 事件循环每次只会执行一次 宏任务，所以如果此时的宏任务队列是这样的 【onDrag，onDrag，onDrag, ....】
   * 处理第一个 onDrag 会使用 scheduler 调度，确认开始时间以及结束时间（schedulerTask），
   * 此时宏任务队列变成 【onDrag, onDrag, ..., scheduler】
   * 处理 scheduler 之前的 onDrag 回调需要经过多个事件循环， 所以就有可能导致时间过长。任务也就延期了
   */
  if (didUserCallbackTimeout) {
    /**
     * 为什么都过期了，还需要重新调度一次？？？感觉再做无用功啊。。。。。。
     * 因为这里是用 concurrent 模式去调度的，在 workLoop 中还是会被中断的。
     * 但是已经过期了，优先级就应该提升，用同步 workLoop 调度，确保不会中断。
     * 由于currentEventTime已经被重置，且还未处于render或commit，所以currentTime是一个新的时间
     */
    const currentTime = requestCurrentTimeForUpdate();
    // 标记任务过期，这样ensureRootIsScheduled时会以同步任务的形式处理该任务
    markRootExpiredAtTime(root, currentTime);
    ensureRootIsScheduled(root);
    return null;
  }

  const expirationTime = getNextRootExpirationTimeToWorkOn(root);
  if (expirationTime === ReactExpirationTime.NoWork) {
    return null;
  }
  
  const originalCallbackNode = root.callbackNode;
  flushPassiveEffects();

  if (expirationTime !== getRenderExpirationTime()) {
    prepareFreshStack(root, expirationTime);
  }

  if (getWorkInProgress()) {
    const prevExecutionContext = getExecutionContext();
    setExecutionContext(ReactContext.RenderContext);

    do {
      try {
        workLoopConcurrent();
        break;
      } catch(e) {
        console.error('concurrent render error', e);
      }
    } while (true)

    setExecutionContext(prevExecutionContext);

    // 这里需要判断是否是中断导致的，不是中断才能 commitRoot
    if (getWorkInProgress() === null) {
      root.finishedExpirationTime = expirationTime;
      commitRoot(root);
    }

    // 重新调度
    ensureRootIsScheduled(root);

    if (root.callbackNode === originalCallbackNode) {
      // 如果下一次schedule的callbackNode和这一次一样，返回一个继续执行的回调函数
      // 具体逻辑见 Scheduler模块 workLoop函数 continuationCallback变量 定义处
      return performConcurrentWorkOnRoot.bind(null, root);
    }
  }

  return null;
}

