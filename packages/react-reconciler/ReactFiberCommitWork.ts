import { ReactRoot } from "../react-dom/ReactRoot";
import { FiberNode } from "./ReactFiber";

// 这里先简单处理
export const commitRoot = (root: FiberNode) => {
  const alternate = root.alternate;
  if (!alternate) {
    return;
  }
  const rootContainer = (alternate.stateNode as ReactRoot).container;
  const dom = alternate.child?.stateNode;
  if (!dom) {
    throw new Error('程序出错')
  }
  rootContainer.appendChild(dom as HTMLElement | Text);
}