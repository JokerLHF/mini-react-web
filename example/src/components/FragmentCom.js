import React from '@mini/react';

const { useState, useCallback, Fragment } = React;

function FragmentCom() {
  const [state, setState] = useState([1, 2, 3]);

  const handleClick = useCallback(() => {
    setState([4, 5, 6])
  }, [state]);

  return (
    <>
      <h1 onClick={handleClick}>点我修改 state</h1>
      <div>
        111
        {state.map(item => <p>{item}</p>)}
      </div>
      <Fragment>
        <div>111</div>
        <div>222</div>
        <Fragment>
          <div>333</div>
          <div>444</div>
        </Fragment>
      </Fragment>
    </>
  );
}
export default FragmentCom;