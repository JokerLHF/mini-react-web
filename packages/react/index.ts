import { REACT_FRAGMENT_TYPE } from '@mini/shared';
import { createElement } from './src/ReactElement';
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from './src/ReactHook';

const React = {
  createElement,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  Fragment: REACT_FRAGMENT_TYPE,
}

export default React;
export * from './src/interface';
export * from './src/ReactHook';
