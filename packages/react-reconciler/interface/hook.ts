/**
 * const [state, updateState] = useState(1);
 * updateState(1);  action 就是1
 * updateState(state => state + 1); action 就是 state => state + 1
 */
export type BasicStateAction<S> = (state: S) => S | S

export type Dispatch<A> = (newState: A) => void;

export type Dispatcher = {
  // initialState 就不支持函数了，
  useState<S>(initialState: S): [S, Dispatch<BasicStateAction<S>>],
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
}

export interface UpdateQueue<A> {
  pending: Update<A> | null, // 环形链表
  dispatch: Dispatch<A> | null,
}

export type Hook = {
  memoizedState: any, // 用来存储当前 hook 的值
  queue: UpdateQueue<any> | null, // 修改hook会产生update， 
  next: Hook | null,
};

export interface ReactHookReducer<S> {
  (state: S, action: BasicStateAction<S>): S
}
