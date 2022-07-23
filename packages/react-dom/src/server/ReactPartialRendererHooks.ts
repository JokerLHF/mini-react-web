import { Dispatcher } from '@mini/react-reconciler';

export const HooksDispatcher: Dispatcher = {
	useState: (initialState) => { return [initialState, () => { return null; }]; },
	useEffect: () => { return null; },
	useLayoutEffect: () => { return  null; },
	useCallback: () => { return null; },
	useRef: (initialState) => { return { current: initialState }; },
	useMemo: (create, deps) => {  
		return create();
	},
};