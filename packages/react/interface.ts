import { REACT_ELEMENT_TYPE } from "../shared/ReactSymbols";

// 先只支持 div p 这种标签类型
export type ReactNodeType = string; 
export type ReactNodeKey = string | null;
export type ReactNodeProps = { [key: string]: any };

export interface ReactNode {
  $$typeof: typeof REACT_ELEMENT_TYPE,
  type: ReactNodeType,
  key: ReactNodeKey,
  props: ReactNodeProps,
}

export type ReactNodeChildren = ReactNodeChild | ReactNodeChild[];
export type ReactNodeChild = string | ReactNode;