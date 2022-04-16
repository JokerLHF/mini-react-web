import { ReactNodeProps } from "../react/interface";

export const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export const isString = (value: any) => {
  return Object.prototype.toString.call(value) === '[object String]';
}

export const isUndefined = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Undefined]';
}

export const isNull = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Null]';
}

export const isNumber = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Number]';
}

export const isBoolean = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Boolean]';
}

export const isArray = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Array]';
}

export const isRawChildren = (children: any) => {
  return isUndefined(children) || isNull(children) || isNumber(children) || isString(children) || isBoolean(children)
}

export const shouldSetTextContent = (props: ReactNodeProps) => {
  return isRawChildren(props.children);
}

export const createTextInstance = (text: string) => {
  return document.createTextNode(text);
}

export const createInstance = (type: string) => {
  const domElement = document.createElement(type);
  return domElement;
}