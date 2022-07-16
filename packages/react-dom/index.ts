import { render } from "./src/client";
import { renderToString } from "./src/server/renderToString";

const ReactDOM = {
  render,
  renderToString,
}

export default ReactDOM;

export * from './src/client/ReactRoot';