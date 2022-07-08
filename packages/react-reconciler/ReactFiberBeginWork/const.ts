// 针对没有update需要更新（没有或者优先级不够）的优化路径
let didReceiveUpdate = false;

// 当hook 计算state发现state改变时通过该函数改变didReceiveUpdate
export const setWorkInProgressDidUpdate = (didUpdate: boolean) => {
  didReceiveUpdate = didUpdate;
}

export const getWorkInProgressDidUpdate = () => {
  return didReceiveUpdate;
}