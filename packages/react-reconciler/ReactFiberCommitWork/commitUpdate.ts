import { ReactFiberHostComponentUpdateQueue, ReactFiberTag } from "../interface/fiber";
import { FiberNode } from "../ReactFiber";
import { patchClass, patchStyle } from "../ReactFiberCompleteWork/diffProps";

export const commitUpdate = (finishedWork: FiberNode) => {
  switch (finishedWork.tag) {
    case ReactFiberTag.HostComponent:
      updateHostComponent(finishedWork);
      break;
    case ReactFiberTag.HostText:
      updateHostText(finishedWork);
      break;
    default:
      return null;
  }
}

const updateDOMProperties = (instance: HTMLElement, updatePayload: ReactFiberHostComponentUpdateQueue) => {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    switch(propKey) {
      case 'className':
        patchClass(instance, propValue);
        break;
      case 'style':
        patchStyle(instance, propValue);
        break;
      default:
        break;
    }
  }
}

const updateHostComponent = (finishedWork: FiberNode) => {
  const instance = finishedWork.stateNode as HTMLElement;
  const updatePayload = finishedWork.updateQueue as ReactFiberHostComponentUpdateQueue;
  if (instance && updatePayload) {
    finishedWork.updateQueue = null;
    updateDOMProperties(instance, updatePayload)
  }
}

const updateHostText = (finishedWork: FiberNode) => {
  const instance = finishedWork.stateNode as Text;
  const newText = finishedWork.pendingProps._reactTextContent;
  instance.nodeValue = newText;
}
