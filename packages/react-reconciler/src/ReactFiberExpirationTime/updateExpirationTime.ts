import { computeAsyncExpiration, computeUserBlockingExpiration, expirationTimeToMs, HIGH_PRIORITY_BATCH_SIZE, HIGH_PRIORITY_EXPIRATION, LOW_PRIORITY_BATCH_SIZE, LOW_PRIORITY_EXPIRATION, msToExpirationTime } from "./index";
import { getCurrentPriorityLevel, getCurrentTime, SchedulerPriorityLevel } from "@mini/scheduler";
import { ReactExpirationTime } from "./interface";
import { getExecutionContext, getRenderExpirationTime } from "../ReactFiberWorkLoop/const";
import { ReactContext } from "../ReactFiberWorkLoop/interface";

let currentEventTime = ReactExpirationTime.NoWork;
export const setCurrentEventTime = (time: number) => {
  currentEventTime = time;
}
export const getCurrentEventTime = () => {
  return currentEventTime;
}

/**
 * 为什么在 render 或者 commit 阶段需要返回不同的 expirationTime 呢？
 * 调用这个函数有3个地方
 * 1. dispatchAction 也就是产生 update 的地方，增加过期时间
 * 2. ensureRootIsScheduled 需要获取当前时间推断出优先级
 * 3. performConcurrentWorkOnRoot 任务过期了获取新的过期时间
 * 4. 程序起点 ReactDom.render 
 * 
 * 对于可能产生 update 的正确做法：
 *   1. useEffect 和 useLayoutEffect 中两者都是在 commit 阶段
 *      那么这个阶段不同 expirationTime 有什么影响吗？
 *      在 ensureRootIsScheduled 阶段会根据 重新获取 requestCurrentTimeForUpdate 和 fiber.expirationTime 取推断优先级，判断是否复用。
 *   2. onClick 中 setState，这种代表一个宏任务的开始执行，处于 NoWork 阶段
 *      同一个事件中的 setState 都可以拿到相同的 expirationTime，复用同一次调度
 * 对于可能产生 update 的错误做法： 
 *   1. 在 render 中，类似 class 的 render 中 setState。 直接死循环了.......  
 */
export function requestCurrentTimeForUpdate() {
  // 当前处于 在react work 中（render 或 commit），返回真实时间
  if ((getExecutionContext() & (ReactContext.RenderContext | ReactContext.CommitContext)) !== ReactContext.NoContext) {
    return msToExpirationTime(getCurrentTime());
  }

  /**
   * 为什么 currentEventTime 需要被复用呢？
   * 我们没有处在react的work流程中（render 或 commit）
   * 当前可能处于事件产生的schedule阶段，比如 onClick回调造成的update。或者 useEffect dispatchAction造成的update
   * currentEventTime在performConcurrentWorkOnRoot中会被重置
   * 在此之前，从产生update到performConcurrentWorkOnRoot之间这段时间， 也就是 pre-render 阶段
   * 如果同一个事件产生了多个update，（比如 useState调用2次），那么他们会共用一个当前时间。
   */
  if (currentEventTime !== ReactExpirationTime.NoWork) {
    return currentEventTime;
  }
  // 这是react被scheduler中断后产生的第一个update，计算一个时间
  currentEventTime = msToExpirationTime(getCurrentTime());
  return currentEventTime;
}

/**
 * 根据 priority 计算不同的 expirationTime
 */
export function computeExpirationForFiber(currentTime: number) {
  const priorityLevel = getCurrentPriorityLevel();
  
  // 如果正处于render阶段，返回本次render的expirationTime
  if ((getExecutionContext() & ReactContext.RenderContext) !== ReactContext.NoContext) {
    return getRenderExpirationTime();
  }

  let expirationTime;
  // 根据Scheduler priority计算过期时间
  // 对这几种priority的解释见 Scheduler模块下的runWithPriority
  switch (priorityLevel) {
    case SchedulerPriorityLevel.ImmediateSchedulerPriority:
      expirationTime = ReactExpirationTime.Sync;
      break;
    case SchedulerPriorityLevel.UserBlockingSchedulerPriority:
      expirationTime = computeUserBlockingExpiration(currentTime);
      break;
    case SchedulerPriorityLevel.NormalSchedulerPriority:
    case SchedulerPriorityLevel.LowSchedulerPriority: 
      expirationTime = computeAsyncExpiration(currentTime);
      break;
    case SchedulerPriorityLevel.IdleSchedulerPriority:
      expirationTime = ReactExpirationTime.Idle;
      break;
    default:
      throw Error("Expected a valid priority level");
  }

  return expirationTime;
}


/**
 * 下面的 expirationTime 是之前从 computeExpirationForFiber 计算得来的，
 * computeExpirationForFiber 总结下来就是如下公式：
 *    a单位 = 10ms
 *    b单位 = 1ms
 *    a单位当前时间 + a单位延迟时间 + (0 <= x <= 25）a单位某一个数 = a单位的过期时间
 * 
 * 所以这里 拿到了 expirationTime 和 currentTime
 * 将a单位过期时间还原为b单位过期时间: a单位过期时间 =  expirationTimeToMs(a单位的过期时间)
 * 将a单位当前时间转换为b单位的当前时间 = expirationTimeToMs(a单位当前时间)
 * 
 * a单位延迟时间转换为b单位延迟时间 = a单位延迟时间 * a单位
 * (0 <= x <= 25）a单位某一个 转换为 (0 <= x <= 25）b单位某一个 = (0 <= x <= 25) * a单位
 * 
 *  expirationTimeToMs(a单位的过期时间) -  expirationTimeToMs(a单位当前时间) = 延迟时间 + 0 <= x <= 250
 *  expirationTimeToMs(a单位的过期时间) -  expirationTimeToMs(a单位当前时间) <= 延迟时间 + 250
 * 
 */
// 从expirationTime中推断优先级
export function inferPriorityFromExpirationTime(currentTime: number, expirationTime: number) {
  if (expirationTime === ReactExpirationTime.Sync) {
    return SchedulerPriorityLevel.ImmediateSchedulerPriority;
  }
  if (expirationTime === ReactExpirationTime.Never || expirationTime === ReactExpirationTime.Idle) {
    return SchedulerPriorityLevel.IdleSchedulerPriority;
  }

  const msUntil = expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);
  if (msUntil <= 0) {
    return SchedulerPriorityLevel.ImmediateSchedulerPriority;
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return SchedulerPriorityLevel.UserBlockingSchedulerPriority;
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return SchedulerPriorityLevel.NormalSchedulerPriority;
  }

  return SchedulerPriorityLevel.IdleSchedulerPriority;
}

/**
 * 上述几个函数调用关系理解起来比较困难：结构如下：
 * 
 * setState 的时候需要为 update 创建 expirationTime，
 *    1. 获取当前时间 currentExpirationTime = requestCurrentTimeForUpdate
 *    2. 根据当前时间获取过期时间 expirationTime,  这个函数目的有两个： computeExpirationForFiber(currentExpirationTime)
 *        1. 根据不同优先级增加不同延迟时间（10ms为单位），得到新的过期时间
 *        2. 过期时间按照 bucketSizeMs（10ms为单位） 为间隔 得到新的结果. 相当于抹平   bucketSizeMs（10ms为单位）差距
 * 
 * 随后进入 pre-render 阶段，
 *    1. 调用 markUpdateTimeFromFiberToRoot 将 expirationTime 向上传递，与当前 firstPendingTime 做优先级比较，优先级高就换成 expirationTime，表示本次调度改为 expirationTime。优先级低就不修改
 *    2. ensureRootUpdate, 
 *        2.1 根据 getNextRootExpirationTimeToWorkOn 获取当前调度的 expirationTime
 *        2.2 获取当前时间：currentExpirationTime = requestCurrentTimeForUpdate
 *        2.3 根据【当前时间】和【过期时间】获取优先级 inferPriorityFromExpirationTime(currentTime, expirationTime);
 *        2.4 根据优先级判断是否需要取掉原来调度进行新一轮调度，或者复用原有调度等
 * 
 *
 * 这两个调用 requestCurrentTimeForUpdate 会是一样的吗？
 *    1. 在onClick事件中是会的，因为onClick 是一次时间循环开始，是 NoWork。 从 dispatchAction 到 ensureRootUpdate 都是同步的，不会经过任何异步逻辑，
 *       所以 requestCurrentTimeForUpdate currentEventTime 会被复用，只有到 performConcurrentWorkOnRoot中 才被重置
 *    2. 在 useEffect， useLayoutEffect 有可能不一样。 因为此时处于 commit 阶段，会返回真实的时间
 *       1. 真实时间会抹平 10ms 的差距， 所以如果 dispatchAction 和 ensureRootUpdate 运行在 10ms 之内，时间是一样的
 *       2. 在根据 currentTime expirationTime 推断优先级的时候，会调用 ceiling，抹平了 25ms 的差距，让非常相近的两次更新得到相同的expirationTime，然后在一次更新中完成。
 *          所以即使上面得到真实时间不一样，这里还是会继续尝试抹平 25ms 的差距，看是否能继续在用一个事件循环中调度
 */

/**
 *  useEffect(() => {
 *    setState(1)
 *    // 1s 的卡顿
 *    setState(2)
 *  })
 * 
 * 每一个 setState 的流程如上，这里需要关心的是 两个 setState 产生的 update 的 expirationTime 是否一致以及会产生什么影响？
 * 
 * 1. 有可能不一致，因为 useEffect 是在 commit 阶段，requestCurrentTimeForUpdate 会抹平 10ms，computeExpirationForFiber 会抹平 25ms。
 *    所以如果两个 setState 之间卡顿过长，这两个 update 的 expirationTime 有可能不一样。
 * 2. 如果不一样的话，那么第一个 setState 产生的 expirationTime 会比较大（表示更快过期）。
 *      那么第二个 setState 之后经过 markUpdateTimeFromFiberToRoot 将 expirationTime 向上传递，与当前 firstPendingTime 做优先级比较，
 *      优先级低于本次调度改为 expirationTime，优先级低就不修改。
 *    由于产生 update 的 expirationTime 不同，那么在第一个 setState 调度时候会去执行 updateQueue，
 *      由于第二次 setState 产生的 update 优先级低，这个 update 会被跳过。等执行完之后本次优先级的 update 之后，重新修改 fiber.expirationTime = update.expirationTime
 *      下一次调度的时候再去执行这个 update。
 *    产生的结果就是： 两个 setState 不再同一个调度中执行，执行了两次更新。
 */