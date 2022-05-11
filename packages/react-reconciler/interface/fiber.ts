import { ReactRoot } from "../../react-dom/ReactRoot";
import { ReactNode, ReactNodeProps } from "../../react/interface";
import { FiberNode } from "../ReactFiber";
import { Hook, ReactHookEffect } from "./hook";

export enum ReactFiberTag {
  // reactRoot
  HostRoot = 1,
  // 标签 类型的 fiber (div p)
  HostComponent = 2,
  // text 类型的 fiber
  HostText = 3,
  // 函数组件
  FunctionComponent = 4,
}

export interface FunctionComponent {
	(props?: ReactNodeProps): ReactNode | null;
}

/**
 * 1. 对于 FunctionComponent, 存储的是 hook 对象环形链表
 * 2. 对于 ReactRoot, 存储的就是对象，属性 element 就是组件
 * 3. 其他情况都是 null
 */
export type ReactFiberMemoizedState = Hook | Record<string, any> | null;

/**
 * 1. 对于 HostComponent 指DOM节点 tagName
 * 2. 对于 FunctionComponent 指向整一个函数 fn
 * 3. 其他情况都是 null
 */
export type ReactFiberType = string | FunctionComponent | null;


/**
 * 1. 对于 HostComponent 指真实的 DOM节点
 * 2. 对于 HostText 来说就是 Text节点
 * 3. 对于 RootFiber 来说就是 ReactRoot 这个类本身
 * 4. 其他情况都是 null
 */
export type ReactFiberStateNode = HTMLElement | Text | ReactRoot | null;

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

export type ReactFiberHostComponentUpdateQueue = any[];
export interface ReactFiberHostRootUpdateQueue {
  baseState: ReactFiberMemoizedState,
  shared: {
    pending: ReactFiberUpdate | null,
  },
}
export interface ReactFiberFunctionComponentUpdateQueue {
  lastEffect: ReactHookEffect | null,
}

/**
 * 1. 对于 HostComponent 指的的 props 的 diff, 结构如下： ['className', 'test', 'style', { color: 'red' } ]
 * 2. 对于 HostRoot 来说就是 ReactFiberHostRootUpdateQueue 结构
 * 3. 对于 FunctionComponent 来说就是 ReactFiberFunctionComponentUpdateQueue，主要存储 useEffect 信息
 * 4. 其他情况都是 null
 */
export type ReactFiberUpdateQueue = ReactFiberHostComponentUpdateQueue | ReactFiberHostRootUpdateQueue | ReactFiberFunctionComponentUpdateQueue | null;


export enum ReactFiberSideEffectTags {
  NoEffect = 0b00000000000,
  Placement = 0b00000000010,
  Update = 0b00000000100,
  PlacementAndUpdate = 0b00000000110,
  Delete = 0b00000001000,
  Passive = 0b01000000000, // 表示 fiber 上有 useEffect
}

export type FiberRoot = FiberNode & {
  tag: ReactFiberTag.HostRoot,
  stateNode: ReactRoot,
};
