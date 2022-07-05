import { React } from '../../packages';

const { useState, useEffect, useLayoutEffect, useCallback } = React;

function Children1() {
  return (
    <div>children1 </div>
  )
}

export default function LifeCycle() {
  const [state, updateState] = useState(1);
  const [num, updateNum] = useState(1);
  const currentRef = useRef();

  useEffect(() => {
    console.log(currentRef, 'currentRef-useEffect');
    currentRef.current.click();
  }, []);

  useEffect(() => {
    console.log('App-useEffect-mount');
    return () => console.log('App-useEffect-unmount');
  }, [state]);

  useLayoutEffect(() => {
    console.log('App-useLayoutEffect-mount');
    return () => console.log('App-useLayoutEffect-unmount');
  }, [state]);

  const handleAddState = useCallback(() => {
    updateState(state + 1);
    console.log('state-click', state);
  }, [state]);

  const handleAddNum = useCallback(() => {
    updateNum(num + 1);
    console.log('num-click', num);
  }, [num]);

  return (
    <div>
      <p>I am</p>
      <p>hongfeng</p>
      <div className={`${state}`} style={{ color: 'red' }}>{state}</div>
      <div className={`${num}`} style={{ color: 'green' }}>{num}</div>
      <Children1 />
      <button onClick={handleAddState}  ref={currentRef}> 点我state + 1 </button>
      <button onClick={handleAddNum}> 点我num +1 </button>
    </div>
  )
}