import { FunctionComponent, ReactHookRef } from "@mini/react-reconciler";
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE, REACT_MEMO_TYPE } from "@mini/shared";

/**
 * 标签类型
 * 函数组件(直接忽略类组件)
 * fragment
 * react.memo
 */
export type ReactElementType = string | FunctionComponent | typeof REACT_FRAGMENT_TYPE | ReactMemoElement; 
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

export interface ReactMemoElement {
  $$typeof: typeof REACT_MEMO_TYPE,
  type: FunctionComponent,
  compare: null | ((oldProps: ReactElementProps, newProps: ReactElementProps) => boolean),
}

/**
 * 对于函数组件来说：可能返回 null string undefined boolean，或者 reactNode
 * 对于ReactFragment来说： 都有可能
 */

type ReactText = string | number;
export type ReactFragment = ReactNode[];
export type ReactNode = ReactElement | ReactText | boolean | null | undefined | ReactFragment;