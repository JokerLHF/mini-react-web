import { getCurrentTime } from "../../scheduler";
import { msToExpirationTime } from "../ReactFiberExpirationTime";
import { ReactExpirationTime } from "../ReactFiberExpirationTime/interface";
import { ReactContext } from "./interface";


// 描述我们在React执行上下文的位置
// CommitContext 会在 commitRoot 有 effect时标记
let executionContext = ReactContext.NoContext;
// 然而，如果同一个事件中产生多个update，那他们的当前时间应该是一样的
let currentEventTime = ReactExpirationTime.NoWork;
export function requestCurrentTimeForUpdate() {
  // TODO: 理解这里是什么意思
  if ((executionContext & (ReactContext.RenderContext | ReactContext.CommitContext)) !== ReactContext.NoContext) {
    // 当前处于 在react work 中（render 或 commit），返回真实时间
    return msToExpirationTime(getCurrentTime());
  }
  // 我们没有处在react的work流程中（render 或 commit）
  // 当前可能处于事件产生的schedule阶段，比如 onClick回调造成的update（虽然我们还没实现onClick）。或者 useEffect dispatchAction造成的update
  // currentEventTime在performConcurrentWorkOnRoot中会被重置
  // 在此之前，从产生update到performConcurrentWorkOnRoot之间这段时间（也就是schedule阶段）
  // 或者任务由于时间不够被中断后又从中断恢复了
  // 如果同一个事件产生了多个update，（比如 useState调用2次），那么他们会共用一个当前时间。
  if (currentEventTime !== ReactExpirationTime.NoWork) {
    // 短时间多次调用requestCurrentTimeForUpdate会走这个逻辑
    // 代表这是同一个浏览器事件触发的多次update
    // 我们将他们统一处理
    return currentEventTime;
  }
  // 这是react被scheduler中断后产生的第一个update，计算一个时间
  currentEventTime = msToExpirationTime(getCurrentTime());
  return currentEventTime;
}