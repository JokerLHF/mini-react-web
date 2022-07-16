import { deleteChild, deleteRemainingChildren } from "../helper/deleteChild";
import { ReactElement } from "@mini/react";
import { createFiberFromElement, FiberNode } from "../../ReactFiber";
import { useFiberAsSingle } from "../helper/cloneChild";

/**
 * - update阶段：遍历【旧节点】看【新节点】是否能复用（key相同，type相同），不能复用就标记删除
 *   - 旧节点：oldFiber1 => oldFiber2 => oldFiber3
 *   - 新节点：element
 * - mount阶段：根据【新节点】创建 fiber
 */
export const reconcileSingleElement = (returnFiber: FiberNode,  currentFirstChild: FiberNode | null, element: ReactElement, renderExpirationTime: number) => {
  let oldFiber = currentFirstChild;
  const key = element.key;
  // update 阶段
  while(oldFiber) {
    if (oldFiber.key === key) {
      if (oldFiber.type === element.type) {
        // 在旧节点中找到了可以复用的 oldFiber，那么剩下其他 oldFiber 就应该被删掉
        deleteRemainingChildren(returnFiber, oldFiber.sibling);
        // 复用 oldFiber
        const existing = useFiberAsSingle(oldFiber, element.props);
        existing.return = returnFiber;
        return existing;
      } else {
        /** 
         * React 文档对于 Key 有一个描述：key 值在兄弟节点之间必须唯一，但不需要是全局唯一。https://zh-hans.reactjs.org/docs/lists-and-keys.html#keys-must-only-be-unique-among-siblings
         * 所以在在单节点 diff 中 React 策略是：如果【新节点】跟【旧节点】匹配到 key 相同，当时 type 不同。
         * 那么就认为整一个【旧节点】列表都匹配不成功，都会被删除，然后创建【新节点】
         */
        deleteRemainingChildren(returnFiber, oldFiber);
        break;
        /**
         * 但是其实如果 key 在兄弟节点之间不唯一并不会报错，只会在控制台 warning。
         * 所以如果我们的 节点是从
         *    <p key={0}>1</p>
         *    <li key={0}>0</li>
         * 变为：
         *    <li key={0}>0</li>
         * 
         * 显然上面的 li 节点并不会被复用，因为虽然【旧节点p】和【新节点li】的 key 一样，但是类型不同。
         * 所以 React 会认为全部匹配失败，旧节点都会被删除，新节点会创建
         */
      }
    } else {
      // key 不同直接删除 oldChild
      deleteChild(returnFiber, oldFiber);
    }
    oldFiber = oldFiber.sibling;
  }

  // mount 阶段
  const created = createFiberFromElement(element, renderExpirationTime);
  created.return = returnFiber;
  return created;
}
