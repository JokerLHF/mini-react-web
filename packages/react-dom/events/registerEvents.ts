import { attemptToDispatchEvent } from "./dispatchEvents";

const allNativeEvents: string[] = ['click', 'dblclick'];
const listenerSet = new Set();

export const listenToAllSupportedEvents = (rootContainerElement: HTMLElement) => {
  allNativeEvents.forEach(domEventName => {
    // 捕获阶段监听
    listenToNativeEvent(domEventName, true, rootContainerElement);
    // 冒泡阶段监听
    listenToNativeEvent(domEventName, false, rootContainerElement);
  });
}

const listenToNativeEvent = (domEventName: string, isCapturePhaseListener: boolean, rootContainerElement: EventTarget) => {
  const listenerSetKey = `${domEventName}_${isCapturePhaseListener}`;
  // 利用set数据结构, 保证相同的事件类型只会被注册一次.
  if (listenerSet.has(listenerSetKey)) {
    return;
  }

  addTrappedEventListener(
    rootContainerElement,
    domEventName,
    isCapturePhaseListener,
  );
  listenerSet.add(listenerSetKey);
}


const addTrappedEventListener = (
  targetContainer: EventTarget,
  domEventName: string,
  isCapturePhaseListener: boolean,
) => {
  // 1. 构造listener
  let listener = attemptToDispatchEvent.bind(
    null,
    domEventName,
    isCapturePhaseListener,
  );
  // 2. 注册事件监听
  if (isCapturePhaseListener) {
    targetContainer.addEventListener(domEventName, listener, false)
  } else {
    targetContainer.addEventListener(domEventName, listener, true);
  }
}