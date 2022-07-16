import { ReactElement } from "@mini/react";
import { ReactRoot } from "./ReactRoot";
import { listenToAllSupportedEvents } from '../events/registerEvents';

export type Container = HTMLElement;

export const render = (element: ReactElement, container: Container) => {
  const root = new ReactRoot(container);
  listenToAllSupportedEvents(container);
  root.render(element);
}