import { ReactElementProps } from "../../react/interface"
import { ReactCurrentDispatcher } from "../../react/ReactHook"
import { FunctionComponent } from "./../interface/fiber"
import { Dispatcher, Hook, } from "../interface/hook"
import { FiberNode } from "../ReactFiber"
import { mountState, updateState } from "./useStateHook"
import { mountEffect, updateEffect } from "./EffectHook/useEffect"
import { mountLayoutEffect, updateLayoutEffect } from "./EffectHook/useLayoutEffect"
import { mountCallback, updateCallback } from "./useCallbackHook"

// 当前函数组件的 workInprogress fiber
let currentlyRenderingFiber: FiberNode | null = null;
// workInProgressHook 属于 workInprogress fiber 当前执行的 fiber
let workInProgressHook: Hook | null = null;
// currentHook 属于 current fiber 当前执行的 fiber
let currentHook: Hook | null = null;

export const getCurrentlyRenderingFiber = () => {
  return currentlyRenderingFiber;
}

export const getWorkInProgressHook = () => {
  return workInProgressHook;
}

export const getCurrentHook = () => {
  return currentHook;
}

export const mountWorkInProgressHook = () => {
  // 注意每个hook（useState/useEffect/useRef...都会有个对应的hook对象）
  const hook: Hook = {
    // mount时的初始化state
    memoizedState: null,
    queue: null,
    // 指向同一个FunctionComponent中下一个hook，构成链表
    next: null
  };
  
  if (!workInProgressHook) {
    // 这是list中第一个hook
    (currentlyRenderingFiber as FiberNode).memoizedState = workInProgressHook = hook;
  } else {
    // 将该hook append到list最后
    workInProgressHook.next = hook;
    // workInProgressHook 往后移动
    workInProgressHook = workInProgressHook.next;
  }
  return workInProgressHook;
}

// 这里的逻辑可以看这里：https://innos.io/space/68003907-707c-b0e6-50b1-f81e4aa54f63?p=fe0e2ad1-d19f-16d4-ae24-f8a44353e2e4_9a2c1bc0-1562-47d2-8ed8-8140592d21e4
export const updateWorkInProgressHook = () => {
  // current fiber
  let nextCurrentHook: Hook | null = null;
  if (!currentHook) {
    const current = (currentlyRenderingFiber as FiberNode).alternate;
    nextCurrentHook = current ? current.memoizedState as Hook : null;
  } else {
    nextCurrentHook = currentHook.next;
  }

  // workInprogress fiber
  let nextWorkInProgressHook: Hook | null = null;
  if (!workInProgressHook) {
    nextWorkInProgressHook = null;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook) {
    // 这里好像永远不会进来，不知道这个逻辑是干什么的。先不写
  } else {
    // nextCurrentHook 已经结束了但是 workInProgressHook 还存在，证明前后两次 render hook 不一致
    if (nextCurrentHook === null) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    // 从 current hook复制来
    currentHook = nextCurrentHook;
    const newHook = {
      memoizedState: currentHook.memoizedState,
      queue: currentHook.queue,
      next: null
    };
    if (!workInProgressHook) {
      // 这是链表中第一个hook
      (currentlyRenderingFiber as FiberNode).memoizedState = workInProgressHook = newHook;
    } else {
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }

  return workInProgressHook!;
}

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useCallback: updateCallback,
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useCallback: mountCallback,
}

export const renderWithHooks = (current: FiberNode | null, workInProgress: FiberNode, ComponentFunc: FunctionComponent, props: ReactElementProps) => {
  currentlyRenderingFiber = workInProgress;
  // 重置数据：update时 重新复制 hook， mount 新建 hook
  workInProgress.memoizedState = null;
  // 重置数据：清除 current 树上的 useEffect 列表
  workInProgress.updateQueue = null;

  // 通过 current区分是否是首次渲染，对应不同hook
  ReactCurrentDispatcher.current = current ? HooksDispatcherOnUpdate : HooksDispatcherOnMount;
  // 渲染函数组件
  const children = ComponentFunc(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;

  return children;
}