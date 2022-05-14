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
      <button onClick={handleAddState}> 点我state + 1 </button>
      <button onClick={handleAddNum}> 点我num +1 </button>
    </div>
  )
}

function App2() {
  const [a, updateA] = useState(null);
  const [b, updateB] = useState(null);

  useEffect(() => {
    console.log(a, "aaaaa");
  }, [a]);

  return (
    <div className="App">
      <h1 onClick={() => updateB(b + 1)}>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <h2>{b}</h2>
    </div>
  );
}

ReactDOM.render(<App />, document.querySelector('#root'))