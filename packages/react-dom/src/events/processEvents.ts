import { DispatchQueue, Listener } from "./interface";

export const processDispatchQueue = (dispatchQueue: DispatchQueue[], inCapturePhase: boolean) => {
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { nativeEvent, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(nativeEvent, listeners, inCapturePhase);
  }
}

const processDispatchQueueItemsInOrder = (nativeEvent: Event, dispatchListeners: Listener[], inCapturePhase: boolean) => {
  if (inCapturePhase) {
    // 1. capture事件: 倒序遍历listeners
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const listener = dispatchListeners[i];
      listener(nativeEvent);
    }
  } else {
    // 2. bubble事件: 顺序遍历listeners
    for (let i = 0; i < dispatchListeners.length; i++) {
      const listener = dispatchListeners[i];
      listener(nativeEvent);
    }
  }
}