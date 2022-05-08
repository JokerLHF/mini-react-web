import { ReactFiberHostRootUpdateQueue, ReactFiberMemoizedState, ReactFiberUpdate, ReactFiberUpdateQueue, ReactFiberUpdateTag } from "./interface/fiber";
import { FiberNode } from "./ReactFiber";

export const createUpdate = (expirationTime: number): ReactFiberUpdate => {
  return {
    expirationTime,
    tag: ReactFiberUpdateTag.UpdateState,
    payload: null,
    next: null,
  };
}

export const initializeUpdateQueue = (fiber: FiberNode) => {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    shared: {
      pending: null
    },
  };
}

const getStateFromUpdate = (update: ReactFiberUpdate, prevState: ReactFiberMemoizedState) => {
  switch (update.tag) {
    case ReactFiberUpdateTag.UpdateState:
      const payload = update.payload;
      if (!payload) return prevState;
      return Object.assign({}, prevState, payload);
    default:
      return null;
  }
}

/**  
 * 1. 插入 u0, 当前pending: u0
 *   - u0 -
 *   |____|  
 * 
 * 2. 插入 u1, 当前pending: u1
 *   u0 - u1
 *   |_____|
 * 
 * 3. 插入 u2, 当前pending: u2
 *   u0 - u1 - u2
 *   |__________| 
 * 
 * 4. 插入 u3, 当前pending: u3
 *   u0 - u1 - u2 - u3
 *   |_______________| 
 */

/**
 * 将update插入单向环状链表 update 是从右边新增, pending也是不断向右移动
 * 故 shared.pending 为 lastPendingUpdate
 * shared.pending.next 为 firstPendingUpdate
 */
export const enqueueUpdate = (fiber: FiberNode, update: ReactFiberUpdate) => {
  const updateQueue = fiber.updateQueue as ReactFiberHostRootUpdateQueue;
  // TODO: fiber已经unmount
  if (!updateQueue) {
    return;
  }

  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  // 使新插入的update始终位于单向环状链表首位
  if (!pending) {
    // 这是第一个update，使他形成单向环状链表
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}

/**
 * update 环形链表解环，通过遍历update链表，计算新的state
 * 最新的 state 在 queue.baseState 和 workInProgress.memoizedState 上面
 */
export const processUpdateQueue = (workInProgress: FiberNode) => {
  const queue = workInProgress.updateQueue as ReactFiberHostRootUpdateQueue;
  // base update 为 单向非环链表
  let firstBaseUpdate = null;

  // 如果有 pendingUpdate，需要将 pendingUpdate 单向环状链表剪开并拼在baseUpdate单向链表后面
  let pendingQueue = queue.shared.pending;
  if (pendingQueue) {
    queue.shared.pending = null;
    firstBaseUpdate = pendingQueue.next;
    pendingQueue.next = null; //  将环剪开
  }

  // 存在 update 时遍历链表，计算出 update 后的值
  if (firstBaseUpdate) {
    let newState = queue.baseState;
    let update: ReactFiberUpdate | null = firstBaseUpdate;

    do {
      // 需要考虑优先级，还未处理
      newState = getStateFromUpdate(update, newState);
      update = update.next;
      if (!update) {
        break;
      }
    } while(true);
    // TODO: 这里为什么要保存两个？为什么 queue 中保存一遍 在 workInprogress 中也需要保存一遍？不能合并吗？
    queue.baseState = newState;
    workInProgress.memoizedState = newState;
  }
}