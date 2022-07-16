export type Dispatcher = {
  // initialState 就不支持函数了，
  useState<S>(initialState: S): [S, Dispatch<BasicStateAction<S>>],
  useEffect(
    create: ReactHookEffectCreate,
    deps?: ReactHookEffectDeps,
  ): void,
  useLayoutEffect(
    create: ReactHookEffectCreate,
    deps?: ReactHookEffectDeps,
  ): void,
  useCallback(
    callback: ReactHookCallback,
    deps?: ReactHookCallbackDeps,
  ): void,
  useRef<T>(initialValue: T): ReactHookRef<T>,
}

/**
 * const [a, setA] = useState('xxx');         // hook1
 *     'xxx' 就是当前 hook 的 memoizedState
 *     每调用 setA 就会产生一个 update，以链表形式
 * 
 * useEffect(() => {});                       // hook2
 * useCallback(() => {});                     // hook3
 * 
 * hook 以链表形式存储
 */
export interface Update<A> {
  action: A,
  next: Update<A> | null,
  expirationTime: number,
}

export interface UpdateQueue<S, A> {
  pending: Update<A> | null,
  dispatch: Dispatch<A> | null,
  lastRenderedReducer: ReactHookReducer<S> | null,
}

export type Hook = {
  memoizedState: ReactHookEffect | ReactHookCallbackMemorized | any, // 用来存储当前 hook 的值, useState 和 useRef 都是 any
  queue: UpdateQueue<any, any> | null, // 修改hook会产生update， 
  next: Hook | null,

  // 遇到第一个优先级不足的 update 之前的 update 的结果值
  baseState: any,
  // 前一次更新优先级不足的 update 组成的列表
  baseQueue: Update<any> | null,
};

export interface ReactHookReducer<S> {
  (state: S, action: BasicStateAction<S>): S
}

/**
 * const [state, updateState] = useState(1);
 * updateState(1);  action 就是1
 * updateState(state => state + 1); action 就是 state => state + 1
 */
export type BasicStateAction<S> = (state: S) => S | S
export type Dispatch<A> = (newState: A) => void;


/**
 * useEffect(() => { return () => {} }, [xxx])
 */
export enum ReactHookEffectFlags {
  NoEffect = 0b000000000000000000,  
  HasEffect = 0b000000000000000010, // 代表是否需要触发effect
  Layout = 0b00000000000000100,    // useLayoutEffect 的标记
  Passive = 0b000000000000001000,   // useEffect 的标记
  Ref = 0b000000000000010000, // useRef 的标记
};

export type ReactHookEffectCreate = () => ReactHookEffectDestroy;
export type ReactHookEffectDestroy = (() => void) | void;
export type ReactHookEffectDeps = any[] | null;
export interface ReactHookEffect {
  tag: ReactHookEffectFlags,
  create: ReactHookEffectCreate,
  destroy: ReactHookEffectDestroy,
  deps: ReactHookEffectDeps,
  next: ReactHookEffect,
}


/**
 * useCallback(callback, [deps]);
 */
export type ReactHookCallbackDeps = any[] | null;
export type ReactHookCallback = () => void;
export type ReactHookCallbackMemorized = [ReactHookCallback, ReactHookCallbackDeps];


/**
 * const ref = useRef()
 */

export interface ReactHookRef<T> {
  current: T,
}
