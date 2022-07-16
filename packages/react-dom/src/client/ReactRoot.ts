import { Container } from "./index";
import { 
  ReactFiberTag,
  createUpdate,
  enqueueUpdate,
  initializeUpdateQueue,
  scheduleUpdateOnFiber,
  ReactExpirationTime,
  FiberNode,
} from "@mini/react-reconciler";
import { SchedulerPriorityLevel, SchedulerTask, FakeSchedulerSyncTask } from "@mini/scheduler";
import { ReactElement } from "@mini/react"

export class ReactRoot {
  current: FiberNode;
  containerInfo: HTMLElement;

  callbackNode: SchedulerTask | FakeSchedulerSyncTask | null;
  callbackPriority: SchedulerPriorityLevel;
  callbackExpirationTime: ReactExpirationTime;

  firstPendingTime: ReactExpirationTime;
  lastExpiredTime: ReactExpirationTime;
  finishedExpirationTime: ReactExpirationTime;

  constructor(container: Container) {
    this.current = new FiberNode(ReactFiberTag.HostRoot);
    // 应用挂载的根DOM节点
    this.containerInfo = container;
    // RootFiber指向FiberRoot
    this.current.stateNode = this;
    // 保存Scheduler保存的当前正在进行的异步任务
    this.callbackNode = null;
    // 保存Scheduler保存的当前正在进行的异步任务的优先级
    this.callbackPriority = SchedulerPriorityLevel.NoSchedulerPriority;
    this.callbackExpirationTime = ReactExpirationTime.NoWork;
    // pending 指还没有commit的任务
    // 在 scheduleUpdateOnFiber--markUpdateTimeFromFiberToRoot中会更新这个值
    // 在 commitRoot--markRootFinishedAtTime中会更新这个值
    this.firstPendingTime = ReactExpirationTime.NoWork;
    // 如果在Scheduler执行workLoop中某一时刻时间片用尽，则会暂停workLoop
    // 这个变量记录过期未执行的fiber的expirationTime
    this.lastExpiredTime = ReactExpirationTime.NoWork;
    // render阶段完成的任务的expirationTime，
    // 在 performWork完成时会被赋值
    // 在 prepareFreshStack（任务开始）、commitRoot（任务结束）会被重置
    this.finishedExpirationTime = ReactExpirationTime.NoWork;

    initializeUpdateQueue(this.current);

    // 方便调试
    (window as any).ReactRootFiber = this;
  }

  render = (element: ReactElement) => {
    const expirationTime = performance.now();
    const update = createUpdate(expirationTime);
    update.payload = { element };

    enqueueUpdate(this.current, update);

    scheduleUpdateOnFiber(this.current, expirationTime);
  }
}