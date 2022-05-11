import { ReactRoot } from "../../../react-dom/ReactRoot";
import { ReactFiberTag } from "../../interface/fiber";
import { FiberNode } from "../../ReactFiber"

/**
 *       div
 *   /    |    \    
 * com1  com2   com3      
 *  ｜        /   ｜  \
 *  11      span com4 div
 *                |    ｜
 *                22   33
 */

export const commitDelete = (finishedWork: FiberNode) => {
  unmountHostComponents(finishedWork);
}

const commitUnmount = () => {
  console.log('unMount');
  // TODO
}

/**
 * 递归子节点，对每一个节点进行 unmount，再一直往上到当前节点
 */
const commitNestedUnmounts = (root: FiberNode) => {
  let node = root;
  while(true) {
    commitUnmount();
    // 递归子节点
    if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    // node 没有 child 的时候
    if (node === root) {
      return;
    }

    // 子节点递归完，没有兄弟节点返回父节点
    while(!node.sibling) {
      if (!node.return || node.return === root) {
        return;
      }
      node = node.return;
    }
  
    // 子节点递归完，有兄弟节点返回兄弟节点
    node.sibling.return = node;
    node = node.sibling;
  }
}

const findParent = (node: FiberNode) => {
  let parent = node.return;
  let currentParent = null;
  findParent: while (true) {
    if (parent === null) {
      throw new Error('Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.',);
    }
    const parentStateNode = parent.stateNode;
    switch (parent.tag) {
      case ReactFiberTag.HostComponent:
        currentParent = parentStateNode as HTMLElement;
        break findParent;
      case ReactFiberTag.HostRoot:
        currentParent = (parentStateNode as ReactRoot).containerInfo;
        break findParent;
    }
    parent = parent.return;
  }
  return currentParent;
}

const unmountHostComponents = (current: FiberNode) => {
  let node = current;
  // 当找到要删除节点的父级DOM节点，该变量置为true，这样当遍历到子节点时不会再执行寻找父级DOM节点的操作
  let currentParentIsValid = false;
  let currentParent;
  
  while (true) {
    // 这个循环到目的是找到要删除的目标节点的父级DOM节点
    if (!currentParentIsValid) {
      currentParent = findParent(node);
      currentParentIsValid = true;
    }

    if (node.tag === ReactFiberTag.HostComponent || node.tag === ReactFiberTag.HostText) {
      // 我们需要遍历下去每个节点，直到叶子节点，从叶子节点触发 componentWillUnmount，再一直往上到当前节点
      commitNestedUnmounts(node);
      // 子节点已经遍历完，可以安全的删除当前节点了
      if (currentParent) {
        currentParent.removeChild(node.stateNode as HTMLElement | Text);
      }
    } else {
      // 同commitNestedUnmounts一样的深度优先遍历
      commitUnmount();

      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === current) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === current) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
}