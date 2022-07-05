import { React } from '../../packages';

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

export default function Bailout() {
  console.log('App3-render');

  return(
    <div>
      <MyInput />
      <Children2 />
    </div>
  )
}