import { ReactRoot } from "@mini/react-dom";
import { ReactElementProps, ReactFragment, ReactMemoElement, ReactNode } from "@mini/react";
import { FiberNode } from "../ReactFiber";
import { Hook, ReactHookEffect } from "./hook";
import { REACT_FRAGMENT_TYPE } from '@mini/shared';

export enum ReactFiberTag {
  // reactRoot
  HostRoot = 1,
  // 标签 类型的 fiber (div p)
  HostComponent = 2,
  // text 类型的 fiber
  HostText = 3,
  // 函数组件
  FunctionComponent = 4,
  // Fragment
  Fragment = 5,
  // React.memo
  MemoComponent = 6,
}


/**
 * 对于 FiberRoot 来说 props 是 null
 * 对于 textFiber 的 props 就是 string，也就是 textContent
 * 对于 Fragment 来说 props 就是 children 节点
 * 其他有 props 的就是对象, 也就是 createElement 的 props
 */
export type ReactTextFiberProps = string;
export type ReactNormalFiberProps = Record<string, any>;
export type ReactFiberRootProps = null;
export type ReactFragmentProps = ReactFragment;

export type ReactFiberProps = ReactNormalFiberProps | ReactFiberRootProps | ReactTextFiberProps | ReactFragmentProps;

export interface FunctionComponent {
	(props?: ReactElementProps): ReactNode;
}

/**
 * 1. 对于 FunctionComponent, 存储的是 hook 对象环形链表
 * 2. 对于 FiberRoot, 存储的就是对象，属性 element 就是组件
 * 3. 其他情况都是 null
 */
export type ReactFiberMemoizedState = Hook | Record<string, any> | null;

/**
 * 1. 对于 HostComponent 指DOM节点 tagName
 * 2. 对于 FunctionComponent 指向整一个函数 fn
 * 3. 对于 Fragment 来说就是一个标志
 * 4. 对于 React.memo 来说就是一个 ReactMemoElement
 * 5. 其他情况都是 null
 */
export type ReactFiberType = string | FunctionComponent | typeof REACT_FRAGMENT_TYPE | null | ReactMemoElement;


/**
 * 1. 对于 HostComponent 指真实的 DOM节点
 * 2. 对于 HostText 来说就是 Text节点
 * 3. 对于 FiberRoot 来说就是 ReactRoot 这个类本身
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
