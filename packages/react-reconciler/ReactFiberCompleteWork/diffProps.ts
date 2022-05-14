
import { ReactNodeProps } from "../../react/interface";
import { isFunction, isObject, isString } from "../../shared/utils";

export const patchClass = (el: HTMLElement, nextPropVal: any) => {
  if (isString(nextPropVal)) {
    el.className = `${nextPropVal}`;
  }
}

export const patchStyle = (el: HTMLElement, nextPropVal: any) => {
  if (isObject(nextPropVal)) {
    for (const key in nextPropVal) {
      el.style[key as any] = nextPropVal[key];
    }
  }
}

// 这里的 props 简单处理后续有余力再看合成事件，现在只支持最简单的事件以及 style className
export const setInitialDOMProperties = (instance: HTMLElement, nextProps: ReactNodeProps) => {
  for (let propKey in nextProps) {
    const newProp = nextProps[propKey];
    switch (propKey) {
      case 'className':
        patchClass(instance, newProp);
        break;
      case 'style':
        patchStyle(instance, newProp);
        break;
      default:
        patchEvent(instance, propKey, null, newProp);
        break;
    }
  }
}

export const diffProperties = (instance: HTMLElement, oldProps: ReactNodeProps, newProps: ReactNodeProps) => {
  let updatePayload: any[] | null = null;
  for (let propKey in newProps) {
    const newProp = newProps[propKey];
    const oldProp = oldProps ? oldProps[propKey] : undefined;
    // 相等或者都不存在
    if (newProp === oldProp || (!newProp && !oldProp)) {
      continue;
    }
    switch (propKey) {
      case 'className':
        const classUpdates = diffClass(propKey, oldProp, newProp);
        if (classUpdates) {
          (updatePayload = updatePayload || []).push(...classUpdates);
        }
        break;
      case 'style':
        const styleUpdates = diffStyle(propKey, oldProp, newProp);
        if (styleUpdates) {
          (updatePayload = updatePayload || []).push(...styleUpdates);
        }
        break;
      default:
        // 因为没有做合成事件，所以这里就先直接 patch 了，不走 update 逻辑。
        patchEvent(instance, propKey, oldProp, newProp);
        break;
    }
  }
  return updatePayload;
}

// class 只考虑是 string
const diffClass = (propKey: string, prevPropVal: any, nextPropVal: any) => {
  if (prevPropVal !== nextPropVal && isString(nextPropVal)) {
    return [propKey, nextPropVal]
  }
  return null;
}

// style 只考虑是 object 的情况
const diffStyle = (propKey: string, prevPropVal: any, nextPropVal: any) => {
  if (prevPropVal !== nextPropVal && isObject(nextPropVal)) {
    return [propKey, nextPropVal]
  }
  return null;
}

/**
 * TODO：每次 FunctionComponent reRender 的时候 props onClick 的指向都会改变，所以 removeEventListener 无法删除。
 * 导致点击多次 div 上绑定了多个同样内容 onClick 事件。触发了多次 onClick
 */
const patchEvent = (el: HTMLElement, key: string, prevPropVal: any, nextPropVal: any) => {
  // 事件
  if (/^on[^a-z]/.test(key)) {
    if (!isFunction(nextPropVal)) {
      return;
    }
    
    const eventName = key.slice(2).toLowerCase();
    
    if (prevPropVal && isFunction(prevPropVal)) {
      el.removeEventListener(eventName, prevPropVal);
    }
    if (nextPropVal && isFunction(nextPropVal)) {
      el.addEventListener(eventName, nextPropVal);
    }
  }
}