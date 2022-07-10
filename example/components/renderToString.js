import { React, ReactDOM } from '../../packages';

const { renderToString } = ReactDOM.server;
const { useState } = React;

function Children2(props) {
  return (
    <div>
      children2
      {props.children}
    </div>
  )
}

function Children1() {
  const [state, setState] = useState(1);
  return (
    <div a="1">
      children1
      <Children2>
        <div>1111</div>
      </Children2>
      <p>{state}</p>
    </div>
  )
}

export default function RenderToStringCom() {
  const handleClick = () => {
    const res = renderToString(<Children1 />);
    console.log('res', res);
  };

  return (
    <div>
      <button onClick={handleClick}> 点我 renderToString </button>
    </div>
  )
}