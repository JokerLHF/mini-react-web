import { REACT_ELEMENT_TYPE } from '../shared/ReactSymbols';
import { ReactElement, ReactElementKey, ReactElementProps, ReactElementType } from './interface';

const ReactElement = (type: ReactElementType, key: ReactElementKey, props: ReactElementProps): ReactElement => {
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
 * https://old.babeljs.cn/repl/#?babili=false&browsers=&build=&builtIns=false&code_lz=MYewdgzgLgBAwgCwJYBsAmAmGBeGAKAShwD4YBvAKAEgAnAUygFcax8KYPOAeAMRoEMA5gFs6YKKXadpARjlTpHLmiQA3Yhk1cA9CvULFYRihQGl2vkNHjiUqgQDcFAL4UgA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&lineWrap=true&presets=es2015%2Creact&prettier=false&targets=&version=6.26.0&envVersion=1.6.2
 * 
 * 像下面这种是不会经过 createElement 的，因为 jsx 只有 标签 和 组件，对于 null 和 '111' 来说都不是
 *   const Child = () => {
 *     return null;
 *     return '1111'
 *   }
 *
 * 但是如果是作为子节点的话就可以：
 *   const Child = () => {
 *     return (
 *        <>
 *          null 111
 *          <div>222</div>
 *        </>
 *     )
 *   }
 */
export const createElement = (type: ReactElementType, config: ReactElementProps, ...children:  (ReactElement | string)[]) => {
  const props: ReactElementProps = config || {};
  const length = children.length;
  // 多个children使用数组的形式, 没有 children 就没有 children 字段
  if (length === 1) {
    props.children = children[0];
  } else if (length > 1) {
    props.children = children;
  }
  return ReactElement(type, null, props)
}