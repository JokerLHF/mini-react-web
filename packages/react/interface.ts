import { FunctionComponent } from "../react-reconciler/interface/fiber";
import { REACT_ELEMENT_TYPE } from "../shared/ReactSymbols";

// 只支持标签类型 以及 函数组件(直接忽略类组件)
export type ReactNodeType = string | FunctionComponent; 
export type ReactNodeKey = string | null;
export type ReactNodeProps = { [key: string]: any };

export interface ReactNode {
  $$typeof: typeof REACT_ELEMENT_TYPE,
  type: ReactNodeType,
  key: ReactNodeKey,
  props: ReactNodeProps,
}

export type ReactNodeChild = string | ReactNode;
export type ReactNodeChildren = ReactNodeChild | ReactNodeChild[];