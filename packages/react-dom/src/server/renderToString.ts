import { ReactCurrentDispatcher, ReactElement, ReactElementType, ReactNode } from "@mini/react";
import { isArray, isText } from "@mini/shared";
import { HooksDispatcher } from "./ReactPartialRendererHooks";

interface Frame {
  type: ReactElementType,
  content: string,
  footer: string,
  children: (ReactElement | string)[],
}

// 处理某一个节点
const renderDOM = (child: ReactNode): Frame => {
  const frame: Frame = {
    type: '',
    children: [],
    footer: '',
    content: ''
  };

  if (isText(child)) {
    frame.content = child as string;
    return frame;
  }

  const { type, props } = child as ReactElement;
  frame.type = type;

  if (typeof type === 'function') {
    const content = handleNodeToString(type(props))
    frame.content = content;
  } else if (typeof type === 'string'){ // 只处理 标签节点
    // 处理 props
    let propsStr = ''    
    Object.keys(props).forEach((key: string) => {
      if (key !== 'children') {
        propsStr += ` ${key}="${props[key]}"`;
      }
    });
    // 处理自己
    frame.content = `<${type}` + propsStr + '>';
    frame.footer = `</${type}>`;
    
    frame.children = isArray(props.children) ? [...props.children] : [props.children];
  } else {
    // null Fragment 等处理逻辑
  }

  return frame;
}

const handleNodeToString = (reactNode: ReactNode): string => {
  // 处理自己
  const frame = renderDOM(reactNode)

  // 处理子节点
  const children  = frame.children || [];
  for (let i = 0; i < children.length; i++) {
    frame.content += handleNodeToString(children[i]);
  }
  
  return frame.content + frame.footer;
}

export const renderToString = (reactNode: ReactNode): string => {
  const previousDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = HooksDispatcher;
  const res = handleNodeToString(reactNode)
  ReactCurrentDispatcher.current = previousDispatcher;
  return res;
}