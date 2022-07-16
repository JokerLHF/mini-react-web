import { ReactFiberTag, ReactNormalFiberProps, FiberNode, internalInstanceKey } from "@mini/react-reconciler";
import { runWithPriority, SchedulerPriorityLevel } from "@mini/scheduler";
import { isFunction } from "@mini/shared/src/utils";
import { DispatchQueue, Listener } from "./interface";
import { processDispatchQueue } from "./processEvents";

const getEventTarget = (nativeEvent: Event) => {
  let target = nativeEvent.target as HTMLElement;
  return target.nodeType === 3 ? target.parentNode : target;
}

const getClosestInstanceFromNode = (nativeEvent: Node | null) => {
  return (nativeEvent as any)[internalInstanceKey]
}

export const createEventListenerWrapperWithPriority = (
  domEventName: string,
  isCapturePhaseListener: boolean,
  nativeEvent: Event,
) => {
  return runWithPriority(
    SchedulerPriorityLevel.UserBlockingSchedulerPriority,
    dispatchEvent.bind(
      null,
      domEventName,
      isCapturePhaseListener,
      nativeEvent,
    ),
  );
}

export function dispatchEvent(
  domEventName: string,
  isCapturePhaseListener: boolean,
  nativeEvent: Event,
) {
  // 1. 定位原生DOM节点
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 2. 获取与DOM节点对应的fiber节点
  let targetFiber = getClosestInstanceFromNode(nativeEventTarget);
  // 3. 通过插件系统, 派发事件
  extractEvents(
    domEventName,
    nativeEvent,
    targetFiber,
    isCapturePhaseListener,
  );
  return null;
}

const extractEvents = (
  domEventName: string,
  nativeEvent: Event,
  targetFiber: FiberNode,
  isCapturePhaseListener: boolean,
) => {
  // 1. 收集从 targetFiber 到 rootFiber所有监听该事件的函数.
  const listeners = accumulateSinglePhaseListeners(targetFiber, domEventName, isCapturePhaseListener);
  // 2. 构造合成事件, 添加到派发队列
  const dispatchQueue: DispatchQueue[] = [];
  if (listeners.length > 0) {
    dispatchQueue.push({ nativeEvent, listeners });
  }
  // 3. 执行派发事件
  processDispatchQueue(dispatchQueue, isCapturePhaseListener);
}

const accumulateSinglePhaseListeners = (
  targetFiber: FiberNode,
  domEventName: string, // onClick
  isCapturePhaseListener: boolean,
) => {
  const listeners: Listener[] = [];
  const reactEventName = getReactEventName(domEventName, isCapturePhaseListener);

  let instance: FiberNode | null = targetFiber;
  while(instance !== null) {
    const { stateNode, tag } = instance;
    // 当节点类型是HostComponent时(如: div, span, button等类型)
    if (tag === ReactFiberTag.HostComponent && stateNode !== null) {
      const listener = getListener(instance, reactEventName);
      listener && listeners.push(listener);
    }
    instance = instance.return;
  }

  return listeners;
}

// click => onClick 
// click => onClickCapture
const getReactEventName = (domEventName: string, isCapturePhaseListener: boolean) => {
  const reactName = 'on' + domEventName[0].toLocaleUpperCase() + domEventName.slice(1, domEventName.length);
  const reactEventName = isCapturePhaseListener ? `${reactName}Capture` : reactName;
  return reactEventName;
}

const getListener = (fiber: FiberNode, reactEventName: string) => {
  // 只有 HostComponent 才能注册 事件, HostComponent 的 props 是对象
  const listener = (fiber.pendingProps as ReactNormalFiberProps)[reactEventName];
  return isFunction(listener) ? listener : null;
}