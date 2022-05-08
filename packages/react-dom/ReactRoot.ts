import { Container } from ".";
import { ReactFiberTag } from "../react-reconciler/interface/fiber";
import { FiberNode } from "../react-reconciler/ReactFiber"
import { scheduleUpdateOnFiber } from "../react-reconciler/ReactFiberWorkLoop";
import { createUpdate, enqueueUpdate, initializeUpdateQueue } from "../react-reconciler/ReactUpdateQueue";
import { ReactNode } from "../react/interface"

export class ReactRoot {
  current: FiberNode;
  containerInfo: HTMLElement;

  constructor(container: Container) {
    this.current = new FiberNode(ReactFiberTag.HostRoot);
    // 应用挂载的根DOM节点
    this.containerInfo = container;
    // RootFiber指向FiberRoot
    this.current.stateNode = this;

    initializeUpdateQueue(this.current);

    // 方便调试
    (window as any).ReactRootFiber = this.current;
  }

  render = (element: ReactNode) => {
    const expirationTime = performance.now();
    const update = createUpdate(expirationTime);
    update.payload = { element };

    enqueueUpdate(this.current, update);

    scheduleUpdateOnFiber(this.current);
  }
}