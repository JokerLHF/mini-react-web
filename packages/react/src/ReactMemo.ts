import { FunctionComponent } from "@mini/react-reconciler";
import { REACT_MEMO_TYPE } from "@mini/shared";
import { ReactElementProps, ReactMemoElement } from "./interface";

export const memo = (
  type: FunctionComponent,
  compare?: (oldProps: ReactElementProps, newProps: ReactElementProps) => boolean,
) => {
  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare,
  };
  return elementType as ReactMemoElement;
}
