import { createInstance, createTextInstance } from "../shared/utils";
import { ReactFiberTag } from "./interface/fiber";
import { FiberNode } from "./ReactFiber";

/**
 *     div
 *   /      \    
 *  div     com      
 *        /   ｜  \
 *      span com  div
 *            |
 *           123 
 * 
 * appendAllChildren 用于将子DOM节点（chid,child.sibling...）append到创建的DOM节点上（instance）
 * 这样当completeWork递归上去时DOM树其实是从底到顶一层层构建好的，commit阶段只需要把顶层root append到container即可
 * 用上面的例子，workInprogress 是顶部的div，那么实际上只需要将 span 123 div div 这些append到workInprogress就好 对于com可以直接跳过
 */
export const appendAllChildren = (parent: HTMLElement, workInProgress: FiberNode) => {
  let node = workInProgress.child;

  while (node) {
    if (node.tag === ReactFiberTag.HostComponent || node.tag === ReactFiberTag.HostText) {
      parent.appendChild(node.stateNode as HTMLElement | Text);
    } else if (node.child) {
      // 这里是考虑到组件的情况： 因为组件没有真实 dom 节点，需要跳过组件遍历其子节点
      node = node.child;
      continue;
    }

    if (node === workInProgress) {
      return;
    }

    // 这里用 while 原因：没有兄弟节点证明这一层已经遍历完了，需要会【回溯】上一层继续遍历。如果上一层依旧没有兄弟节点证明上一层也遍历完了，
    // 就会继续回到上上一层，知道回到 workInprogress
    while (!node.sibling) {
      if (!node.return || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }

    // 有兄弟节点处理兄弟节点
    node = node.sibling;
  }
}

/**
 * 进入这里 unitOfWork 肯定是某个子树的叶子节点
 * 这个函数作用是：
 *  1. 根据 fiber tag 类型创建 dom 节点
 *  1. 返回节点的兄弟节点（如果存在），继续走 beginWork，有可能兄弟节点还存在子节点，需要继续为子节点创建 fiber 节点 
 *  2. 不存在兄弟节点递归父节点，为父节点创建 dom
 */
export const completeUnitOfWork = (unitOfWork: FiberNode) => {
  let completedWork: FiberNode | null  = unitOfWork;
  do {
    const current = completedWork.alternate;
    const sibling = completedWork.sibling;

    // 根据 fiber 类型创建 dom 节点
    completeWork(current, completedWork);

    // 有兄弟节点返回兄弟节点，继续走 beginWork 逻辑。因为有可能兄弟节点还存在子节点，需要继续为子节点创建fiber节点 
    if (sibling) {
      return sibling;
    }

    // 兄弟节点也处理完后，向上一级继续处理。为父节点创建 dom 节点
    completedWork = completedWork.return;
  } while(completedWork);

  return null;
}

/**
 *  根据 fiber tag 类型创建 dom 节点。不会渲染到页面上，而是放在 fiber 的 stateNode 属性上
 */
export const completeWork = (current: FiberNode | null, workInProgress: FiberNode) => {
  switch (workInProgress.tag) {
    case ReactFiberTag.HostComponent:
      const instance = workInProgress.stateNode = createInstance(workInProgress.type as string);
      appendAllChildren(instance, workInProgress);
      break;
    case ReactFiberTag.HostText:
      workInProgress.stateNode = createTextInstance(workInProgress.pendingProps._reactTextContent);
      break;
    case ReactFiberTag.HostRoot:
    case ReactFiberTag.FunctionComponent:
      break;
    default:
      break;
  }
}