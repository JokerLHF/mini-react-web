import { Dispatcher } from "../../react-reconciler/interface/hook";

export const HooksDispatcher: Dispatcher = {
  useState: (initialState) => { return [initialState, () => {}] },
  useEffect: () => { },
  useLayoutEffect: () => { },
  useCallback: () => { },
  useRef: (initialState) => { return { current: initialState } },
}