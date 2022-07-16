import { SchedulerTask } from "./interface";

export const push = (heap: SchedulerTask[], node: SchedulerTask) => {
  let index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

// 获取堆顶任务，即 sortIndex 或 id 最小的任务
export const peek = (heap: SchedulerTask[]) => {
  let first = heap[0];
  return first === undefined ? null : first;
}

// 删除堆顶任务
export const pop = (heap: SchedulerTask[]) => {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop()!;
    if (last !== first) {
      heap[0] = last;
      // 从上往下堆化
      siftDown(heap, last, 0);
    }
    return first;
  }
  return null;
}

// 小顶堆向上堆化
export const siftUp = (heap: SchedulerTask[], node: SchedulerTask, i: number) =>{
  let index = i;

  while (true) {
    // 位运算 无符号右移一位
    let parentIndex = index - 1 >>> 1;
    let parent = heap[parentIndex];

    if (parent !== undefined && compare(parent, node) > 0) {
      // parent 更大，交换位置
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

// 小顶堆向下堆化
export const siftDown = (heap: SchedulerTask[], node: SchedulerTask, i: number) => {
  let index = i;
  const length = heap.length;

  while (index < length) {
    const leftIndex = 2 * index + 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // 如果左子节点或右子节点小于目标节点，则交换
    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}

// 先比较sort index，再比较 task id
export const compare = (a: SchedulerTask, b: SchedulerTask) => {
  let diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}