import { FiberNode } from "../ReactFiber";
import { ReactContext } from "./interface";

// 描述我们在React执行上下文的位置
// CommitContext 会在 commitRoot 有 effect时标记
let executionContext = ReactContext.NoContext;
// 正在进行render阶段的任务的renderExpirationTime
let renderExpirationTime: number = 0;
// 正在执行的 fiber
let workInProgress: FiberNode | null = null;

export const getExecutionContext = () => {
  return executionContext;
}

export const setExecutionContext = (newExecutionContext: ReactContext) => {
  executionContext = newExecutionContext;
}

export const getRenderExpirationTime = () => {
  return renderExpirationTime;
}

export const setRenderExpirationTime = (newRenderExpirationTime: number) => {
  renderExpirationTime = newRenderExpirationTime;
}

export const getWorkInProgress = () => {
  return workInProgress;
}

export const setWorkInProgress = (newWorkInProgress: FiberNode | null) => {
  workInProgress = newWorkInProgress;
}
