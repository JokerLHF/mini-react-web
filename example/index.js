import { React, ReactDOM } from '../packages';

const { useState } = React;

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

  return (
    <div>
      <p>I am</p>
      <p>hongfeng</p>
      <div className={`${state}`} style={{ color: 'red' }}>{state}</div>
      <Children1 />
      <button onClick={() => updateState(state + 1)}> 点我+1 </button>
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#root'))