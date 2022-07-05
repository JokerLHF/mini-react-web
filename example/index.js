import { React, ReactDOM } from '../packages';
// import LifeCycle from './components/lifeCycle';
// import Bailout from './components/bailout';
// import DiffPriority from './components/DiffPriority';
import SchedulerTask from './components/SchedulerTask';

function App() {
  // 正常生命周期执行顺序
  // return <LifeCycle />;

  // react 优化路径
  // return <Bailout />;

  // 优先级插队
  // return <DiffPriority />;

  // 优先级饥饿现象
  return <SchedulerTask />;
}

ReactDOM.render(<App />, document.querySelector('#root'))