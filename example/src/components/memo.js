import React from '@mini/react';

const { useState, useCallback, memo } = React;


function Children(props) {
  console.log('Children-render');
  return (
    <div>
      children
      {props.children}
    </div>
  )
}
const MemoCom = memo(Children, (prevProps, nextProps) => {
  return prevProps === nextProps;
});

function Children2(props) {
  console.log('Children2-render');
  return (
    <div>
      children2
      {props.children}
    </div>
  )
}
const MemoCom2 = memo(Children2);

export default function Memo() {
  console.log('App3-render');

  const [state, setState] = useState(1);

  const handleClick = useCallback(() => {
    setState(state + 1);
  }, [state]);

  return(
    <div>
      <button onClick={handleClick}>点我 setState</button>
      <MemoCom>
        <p>22</p>
        <span>33</span>
      </MemoCom>
      <MemoCom2>
        MemoCom2
      </MemoCom2>
    </div>
  )
}
