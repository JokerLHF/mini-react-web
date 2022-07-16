import { FunctionComponent, ReactHookRef } from "@mini/react-reconciler";
import { REACT_ELEMENT_TYPE } from "@mini/shared";

// 只支持标签类型 以及 函数组件(直接忽略类组件)
export type ReactElementType = string | FunctionComponent; 
export type ReactElementKey = string | null;
export type ReactElementProps = {
  [key: string]: any
};

export type ReactElementRef = ReactHookRef<any> | null;

// 相当于 JSX.Element
export interface ReactElement {
  $$typeof: typeof REACT_ELEMENT_TYPE,
  type: ReactElementType,
  key: ReactElementKey,
  props: ReactElementProps,
  ref: ReactElementRef,
}



/**
 * 对于函数组件来说：可能返回 null string undefined boolean，或者 reactNode
 * 对于ReactFragment来说： 都有可能
 */

type ReactText = string | number;
type ReactFragment = ReactNode[];
export type ReactNode = ReactElement | ReactText | boolean | null | undefined | ReactFragment;