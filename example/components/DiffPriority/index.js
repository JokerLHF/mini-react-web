import { React } from '../../../packages';
import './index.css';

const { useState, useCallback, useRef, useEffect } = React;

export default function DiffPriority() {
  const currentRef = useRef();
  const [state, updateState] = useState(0);

  // useEffect 包裹只要是让 setTimeout 执行一次就可以了
  useEffect(() => {
    setTimeout(() => {
      // 正常优先级 setState
      updateState(prevState => prevState + 1);
      // 高优先级 setState
      currentRef.current.click();
    }, 2000);
  }, []);
  
  const handleAddState = useCallback(() => {
    updateState(prevState => prevState + 2);
  }, [state]);

  return (
    <div>
      <div className="container">
        {Array.from(new Array(20000)).map((val, index) => (<div key={index}>{state}</div>))}
      </div>
      <div onClick={handleAddState} ref={currentRef} className="btn">点我</div>
    </div>
  )
}