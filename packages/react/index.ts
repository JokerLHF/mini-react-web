import { REACT_FRAGMENT_TYPE } from '@mini/shared';
import { createElement } from './src/ReactElement';
import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from './src/ReactHook';
import { memo } from './src/ReactMemo';

const React = {
	createElement,
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
	useRef,
	useMemo,
	memo,
	Fragment: REACT_FRAGMENT_TYPE,
};

export default React;
export * from './src/interface';
export * from './src/ReactHook';
