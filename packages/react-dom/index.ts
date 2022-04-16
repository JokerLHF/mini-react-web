import { ReactNode } from "../react/interface";
import { ReactRoot } from "./ReactRoot";

export type Container = Element;

const ReactDOM = {
  render(element: ReactNode, container: Container) {
    const root = new ReactRoot(container);
    root.render(element);
  }
}

export default ReactDOM;