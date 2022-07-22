import { Dispatcher } from "@mini/react-reconciler"

export const HooksDispatcher: Dispatcher = {
  useState: (initialState) => { return [initialState, () => {}] },
  useEffect: () => { },
  useLayoutEffect: () => { },
  useCallback: () => { },
  useRef: (initialState) => { return { current: initialState } },
  useMemo: (create, deps) => {  
    return create();
  },
}