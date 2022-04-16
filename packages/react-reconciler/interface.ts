import { ReactRoot } from "../react-dom/ReactRoot";

export enum ReactFiberTag {
  // reactRoot
  HostRoot = 3,
  // 标签 类型的 fiber (div p)
  HostComponent = 5,
  // text 类型的 fiber
  HostText = 6,
}

// 计算 queue 上 update 列表得到的值
export type ReactFiberMemoizedState = Record<string, any> | null;

/**
 * 1. 对于 HostComponent 指DOM节点 tagName
 */
export type ReactFiberType = string;


/**
 * 1. 对于 HostComponent 指真实的 DOM节点
 * 2. 对于 HostText 来说就是 Text节点
 * 3. 对于 RootFiber 来说就是 ReactRoot 这个类本身
 */
export type ReactFiberStateNode = HTMLElement | Text | ReactRoot;

export enum ReactFiberUpdateTag {
  UpdateState = 0,
  ReplaceState = 1,
  ForceUpdate = 2,
  CaptureUpdate = 3,
}

// update 是以链表的形式存在
export interface ReactFiberUpdate {
  expirationTime: number, // 过期时间
  tag: ReactFiberUpdateTag,
  payload: Record<string, any> | null,
  next: ReactFiberUpdate | null,
}

export interface ReactFiberUpdateQueue {
  baseState: ReactFiberMemoizedState,
  shared: {
    pending: ReactFiberUpdate | null,
  },
}