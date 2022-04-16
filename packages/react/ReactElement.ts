import { REACT_ELEMENT_TYPE } from '../shared/ReactSymbols';
import { ReactNode, ReactNodeChildren, ReactNodeKey, ReactNodeProps, ReactNodeType } from './interface';

const ReactElement = (type: ReactNodeType, key: ReactNodeKey, props: ReactNodeProps): ReactNode => {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    props
  }
}

/**
 * 注意：ReactElement 是有两个级别：
 *  1. dom 标签
 *  2. 组件
 * 对于文本节点（number，boolean, undefined, null）都不会包装成 ReactElement，而是直接作为其父节点的 children
 * {
 *    type: 'div'
 *    key: null
 *    props: { children: ['111', true] }
 * }
 */
export const createElement = (type: ReactNodeType, config: ReactNodeProps, ...children:  ReactNodeChildren[]) => {
  const props: ReactNodeProps = config || {};
  const length = children.length;
  // 多个children使用数组的形式, 没有 children 就没有 children 字段
  if (length === 1) {
    props.children = children[0];
  } else if (length > 1) {
    props.children = children;
  }
  return ReactElement(type, null, props)
}