import { ReactFiberSideEffectTags, ReactFiberTag } from "../../interface/fiber";
import { FiberNode } from "../../ReactFiber";

/**
 * 因为组件是没有真实 dom 的，所以要
 *  向上找到 HostComponent 放在其 dom 上面
 *  向上找到 HostRoot， 放在其 containerInfo 上
 */
const isHostParent = (fiber: FiberNode) => {
  return (
    fiber.tag === ReactFiberTag.HostRoot ||
    fiber.tag === ReactFiberTag.HostComponent
  );
}

/**
 *       div
 *   /    |    \    
 * com1  com2   com3      
 *  ｜        /   ｜  \
 *  11      span com4 div
 *                |    ｜
 *                22   33
 *
 * 向上找到真实的 dom 父节点：
 */
export const getHostParentFiber = (fiber: FiberNode) => {
  let parent = fiber.return;
  while(parent) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  throw new Error(
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.',
  );
}


/**
 *       div
 *   /    |    \    
 * com1  com2   com3      
 *  ｜        /   ｜  \
 *  11      span com4 div
 *                |    ｜
 *                22   33
 * 找到目标DOM节点需要插入在谁之前
 */

export const getHostSibling = (fiber: FiberNode) => {
  let node = fiber;
  siblings: while(true) {
    /**
     * 考虑 fiber.return 是 FunctionComponent，fiber.return.sibling 是 HostComponent
     * 则 fiber.stateNode 和 fiber.return.sibling.stateNode 在DOM树上是兄弟关系
     * 如上图的 11节点 或者 22节点
     */
    while (!node.sibling) {
      if (!node.return || isHostParent(node.return)) {
        // 直接插入到父节点底下就好了 如上图 33节点
        return null;
      }
      node = node.return;
    }

    // 找到兄弟节点
    node.sibling.return = node.return;
    node = node.sibling;

    // 兄弟节点不是Host节点，目标节点不能直接插在当前节点之前
    while (node.tag !== ReactFiberTag.HostComponent && node.tag !== ReactFiberTag.HostText) {
      if (node.effectTag & ReactFiberSideEffectTags.Placement) {
        // 如果当前节点也是需要执行插入操作，再进行一次整个流程
        continue siblings;
      }
      /**
       * 节点不是Host节点，但是他的子节点如果是Host节点，则目标DOM和子节点DOM是兄弟节点
       * 目标DOM应该插入在子节点DOM前面
       * 如果节点没有子节点，则继续寻找兄弟节点
       * 如上图的 com2 以及 com3 节点
       */
      if (!node.child) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    // 到这一步时一定是一个Host节点，判断下该节点是否也是需要插入的节点
    if (!(node.effectTag & ReactFiberSideEffectTags.Placement)) {
      return node.stateNode;
    }
  }
}

/**
 *       div
 *   /    |    \    
 * com1  com2   com3      
 *  ｜        /   ｜  \
 *  11      span com4 div
 *                |    ｜
 *                22   33
 */

export const insertOrAppendPlacementNode = (fiber: FiberNode, before: HTMLElement | Text | null, parent: HTMLElement) => {
  const { tag } = fiber;
  if (tag === ReactFiberTag.HostComponent || tag === ReactFiberTag.HostText) {
    const stateNode = fiber.stateNode as HTMLElement | Text;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode)
    }
  } else {
    // 当前fiber不是host类型，递归其子fiber, 如 com4
    const child = fiber.child;
    if (child) {
      insertOrAppendPlacementNode(child, before, parent);
      // // FunctionComponent 可能返回一个数组，即有多个需要插入的节点
      // // 所以还需要遍历其兄弟节点执行插入，如 Fragment（暂不支持）
      // let sibling = child.sibling;
      // while (sibling) {
      //   insertOrAppendPlacementNode(sibling, before, parent);
      //   sibling = sibling.sibling;
      // }
    }
  }
}