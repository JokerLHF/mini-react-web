import { Container } from ".";
import { ReactFiberTag } from "../react-reconciler/interface/fiber";
import { FiberNode } from "../react-reconciler/ReactFiber"
import { scheduleUpdateOnFiber } from "../react-reconciler/ReactFiberWorkLoop";
import { createUpdate, enqueueUpdate, initializeUpdateQueue } from "../react-reconciler/ReactUpdateQueue";
import { ReactNode } from "../react/interface"

export class ReactRoot {
  current: FiberNode;
  container: Element;

  constructor(container: Container) {
    this.current = new FiberNode(ReactFiberTag.HostRoot);
    this.container = container;
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