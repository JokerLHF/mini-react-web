import { ReactElement } from "../react/interface";
import { listenToAllSupportedEvents } from "./events/registerEvents";
import { ReactRoot } from "./ReactRoot";
import { renderToString } from "./server/renderToString";

export type Container = HTMLElement;

const ReactDOM = {
  render(element: ReactElement, container: Container) {
    const root = new ReactRoot(container);
    listenToAllSupportedEvents(container);
    root.render(element);
  },
  server: {
    renderToString,
  }
}

export default ReactDOM;