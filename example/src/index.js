import React from '@mini/react';
import ReactDOM from '@mini/react-dom';

// import LifeCycle from './components/lifeCycle';
// import Bailout from './components/bailout';
// import FragmentCom from './components/fragmentCom';
// import DiffPriority from './components/DiffPriority';
// import SchedulerTask from './components/SchedulerTask';
// import RenderToStringCom from './components/renderToString';
import Memo from './components/memo';

function App() {
  // 正常生命周期执行顺序
  // return <LifeCycle />;

  // react 优化路径
  // return <Bailout />;

  // 优先级插队
  // return <DiffPriority />;

  // 优先级饥饿现象
  // return <SchedulerTask />;

  // renderToString
  // return <RenderToStringCom />

  // Fragment
  // return <FragmentCom />

  // Memo
  return <Memo />
}

ReactDOM.render(<App />, document.querySelector('#root'))

console.log('debkkbdhwdbhwk');