import React from '@mini/react';

const { useState, useCallback } = React;

function Children2() {
  console.log('Children2-render');
  return (
    <div>children2</div>
  )
}

function MyInput() {
  const [state, updateState] = useState(1);

  const handleAddState = useCallback(() => {
    updateState(state + 1);
    console.log('state-click', state);
  }, [state]);

  console.log('MyInput-render');

  return (
    <div>
      <div className={`${state}`} style={{ color: 'red' }}>{state}</div>
      <button onClick={handleAddState}> 点我state + 1 </button>
    </div>
  )
}

function UseStateBailout() {
  const [state, setState] = useState([1]);

  // setState 的值相同是不会引起 re-render 的
  const handleClick = useCallback(() => {
    console.log("clik");
    const newState = state;
    newState.push(2)
    setState(newState);
  }, [state]);

  console.log("render", state);

  return (
    <div className="App">
      <h1 onClick={handleClick}>点我 setState 相同的值</h1>
      <div>
        {state.map(item => <p>{item}</p>)}
      </div>
    </div>
  );
}

export default function Bailout() {
  console.log('App3-render');

  return(
    <div>
      <MyInput />
      <Children2 />
      <UseStateBailout />
    </div>
  )
}