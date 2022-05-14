import { React, ReactDOM } from '../packages';

const { useState, useEffect, useLayoutEffect, useCallback } = React;

function Children2() {
  return (
    <div>children2</div>
  )
}
function Children1() {
  return (
    <div>
      children1
      <Children2 />
    </div>
  )
}

function App() {
  const [state, updateState] = useState(1);
  const [num, updateNum] = useState(1);

  useEffect(() => {
    console.log('App-useEffect-mount');
    return () => console.log('App-useEffect-unmount');
  }, [state]);

  useLayoutEffect(() => {
    console.log('App-useLayoutEffect-mount');
    return () => console.log('App-useLayoutEffect-unmount');
  }, [state]);

  const handleClick = useCallback(() => {
    updateState(state + 1);
    console.log('click', state);
  }, [state]);

  return (
    <div>
      <p>I am</p>
      <p>hongfeng</p>
      <div className={`${state}`} style={{ color: 'red' }}>{state}</div>
      <div className={`${num}`} style={{ color: 'green' }}>{num}</div>
      <Children1 />
      <button onClick={handleClick}> 点我state + 1 </button>
      <button onClick={() => updateNum(num + 1)}> 点我num +1 </button>
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#root'))