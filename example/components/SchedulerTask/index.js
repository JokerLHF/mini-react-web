import { React } from '../../../packages';
import './index.css';

const { useState, useCallback, useRef, useEffect } = React;

export default function SchedulerTask() {
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
  
  useEffect(() => {
    const target = document.querySelector('.drag-element');
    target.addEventListener('mousedown', e => {
      const x = e.clientX - target.offsetLeft;
      const y = e.clientY- target.offsetTop;

      document.onmousemove = function(moveE){
        console.log('mousemove');
        target.style.left = moveE.clientX - x + 'px'
        target.style.top = moveE.clientY - y + 'px'
      };
      document.onmouseup = function() {
        document.onmousemove = null;
        document.onmouseup = null;
      }
    });
  }, []);

  const handleAddState = useCallback(() => {
    updateState(prevState => prevState + 2);
  }, [state]);

  return (
    <div className="container">
      <div className="state-container">
        {Array.from(new Array(50000)).map((val, index) => (<div key={index}>{state}</div>))}
      </div>
      <div className="drag-container">
        <div className='drag-element'/>
      </div>
      <div onClick={handleAddState} ref={currentRef} className="btn">点我</div>
    </div>
  )
}
