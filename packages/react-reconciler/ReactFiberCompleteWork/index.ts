import { ReactFiberTag } from "../interface/fiber";
import { FiberNode } from "../ReactFiber";
import { completeHostComponentWork } from "./completeHostComponent";
import { completeHostTextWork } from "./completeHostText";
import { collectEffectListToParent } from "./helper";

/**
 *  根据 fiber tag 类型创建 dom 节点。不会渲染到页面上，而是放在 fiber 的 stateNode 属性上
 */
 const completeWork = (current: FiberNode | null, workInProgress: FiberNode) => {
  switch (workInProgress.tag) {
    case ReactFiberTag.HostComponent:
      return completeHostComponentWork(current, workInProgress);
    case ReactFiberTag.HostText:
      return completeHostTextWork(current, workInProgress);
    case ReactFiberTag.HostRoot:
    case ReactFiberTag.FunctionComponent:
    default:
      return null;
  }
}

/**
 * 进入这里 unitOfWork 肯定是某个子树的叶子节点
 * 这个一个 while 函数，结束条件是存在兄弟节点或者没有 return(也就是到 rootFiber)，作用是：
 *  1. 根据 fiber tag 类型创建 dom 节点
 *  2. 将 fiber 节点的 effectList append 到父节点上
 *  3. 返回节点的兄弟节点（如果存在），继续走 beginWork，有可能兄弟节点还存在子节点，需要继续为子节点创建 fiber 节点 
 *  4. 不存在兄弟节点递归父节点，为父节点创建 dom
 */
export const completeUnitOfWork = (unitOfWork: FiberNode) => {
  let completedWork: FiberNode | null  = unitOfWork;
  do {
    const current = completedWork.alternate;
    const sibling = completedWork.sibling;
    const returnFiber = completedWork.return;

    // 根据 fiber 类型创建 dom 节点
    completeWork(current, completedWork);
    // 收集 effectList 列表
    collectEffectListToParent(returnFiber, completedWork);

    // 有兄弟节点返回兄弟节点，继续走 beginWork 逻辑。因为有可能兄弟节点还存在子节点，需要继续为子节点创建fiber节点 
    if (sibling) {
      return sibling;
    }

    // 兄弟节点也处理完后，向上一级继续处理。为父节点创建 dom 节点
    completedWork = completedWork.return;
  } while(completedWork);

  return null;
}