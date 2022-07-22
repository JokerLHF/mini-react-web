import React from '@mini/react';
import ReactDOM from '@mini/react-dom';


const { renderToString } = ReactDOM;
const { useState, useMemo } = React;

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

  const val = useMemo(() => {
    return <Children2 />
  }, [state]);

  return (
    <div a="1">
      {val}
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