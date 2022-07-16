import { ReactHookEffectFlags } from "../interface/hook";
import { FiberNode } from "../ReactFiber";
import { mountWorkInProgressHook, updateWorkInProgressHook } from "./index";

export const mountRef = <T>(initialValue: T) => {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}

export const updateRef = <T>(initialValue: T) => {
  var hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

/**
 * ref 的写法只支持下面两种，其他写法不支持：
 * 
 * const currentRef = useRef();
 * <div ref={currentRef} />
 * 
 * const currentRef = useRef();
 * currentRef.current = 111;
 */
export const markRef = (current: FiberNode | null, workInProgress: FiberNode) => {
  const ref = workInProgress.ref;
  if (current === null && ref !== null) {
    workInProgress.effectTag |= ReactHookEffectFlags.Ref;
  }
}