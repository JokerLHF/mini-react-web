export type Dispatch<A> = (newState: A) => void;

export type Dispatcher = {
  // initialState 就不支持函数了，
  useState<S>(initialState: S): [S, Dispatch<S>],
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

export interface UpdateQueue<S> {
  pending: Update<S> | null, // 环形链表
}

export type Hook = {
  memoizedState: any, // 用来存储当前 hook 的值
  queue: UpdateQueue<any> | null, // 修改hook会产生update， 
  next: Hook | null,
};