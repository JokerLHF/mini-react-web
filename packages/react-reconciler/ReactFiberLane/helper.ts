import { SchedulerPriorityLevel } from "../../scheduler/interface";
import { ReactLane, ReactLanePriority } from "./interface";

export function mergeLanes(a: ReactLane, b: ReactLane) {
  return a | b;
}

export const pickArbitraryLane = (lanes: ReactLane) => {
  return lanes & -lanes;
}

// 将 scheduler 的优先级转换为 lane 的优先级
export const schedulerPriorityToLanePriority = (schedulerPriorityLevel: SchedulerPriorityLevel) => {
  switch (schedulerPriorityLevel) {
    case SchedulerPriorityLevel.ImmediateSchedulerPriority:
      return ReactLanePriority.SyncLanePriority;
    case SchedulerPriorityLevel.UserBlockingSchedulerPriority:
      return ReactLanePriority.InputContinuousLanePriority;
    case SchedulerPriorityLevel.NormalSchedulerPriority:
    case SchedulerPriorityLevel.LowSchedulerPriority:
      return ReactLanePriority.DefaultLanePriority;
    case SchedulerPriorityLevel.IdleSchedulerPriority:
      return ReactLanePriority.IdleLanePriority;
    default:
      return ReactLanePriority.NoLanePriority;
  }
}

// 将 lane 的优先级转换为 scheduler 的优先级
export const lanePriorityToSchedulerPriority = (lanePriority: ReactLanePriority) => {
  switch (lanePriority) {
    case ReactLanePriority.SyncLanePriority:
      return SchedulerPriorityLevel.ImmediateSchedulerPriority;
    case ReactLanePriority.InputContinuousLanePriority:
      return SchedulerPriorityLevel.UserBlockingSchedulerPriority;
    case ReactLanePriority.DefaultLanePriority:
      return SchedulerPriorityLevel.NormalSchedulerPriority;
    case ReactLanePriority.IdleLanePriority:
      return SchedulerPriorityLevel.IdleSchedulerPriority;
    case ReactLanePriority.NoLanePriority:
      return SchedulerPriorityLevel.NoSchedulerPriority;
    default:
      throw new Error('优先级出错了')
  }
}


// 根据 lanePriority 计算 lane
export function findUpdateLane(
  lanePriority: ReactLanePriority,
  wipLanes: ReactLane,
) {
  switch (lanePriority) {
    case ReactLanePriority.SyncLanePriority:
      return ReactLane.SyncLane;
    case ReactLanePriority.SyncBatchedLanePriority:
      return ReactLane.SyncBatchedLane;
    case ReactLanePriority.DefaultLanePriority: {
      let lane = pickArbitraryLane(ReactLane.DefaultLanes & ~wipLanes);
      if (lane === ReactLane.NoLane) {
        lane = pickArbitraryLane(ReactLane.DefaultLanes);
      }
      return lane;
    }
    case ReactLanePriority.IdleLanePriority: {
      let lane = pickArbitraryLane(ReactLane.IdleLanes & ~wipLanes);
      if (lane === ReactLane.NoLane) {
        lane = pickArbitraryLane(ReactLane.IdleLanes);
      }
      return lane;
    }
    case ReactLanePriority.NoLanePriority:
    default:
      break;
  }
}