## 版本信息
- 基于react 16.13.1 使用 ts 实现了一个 mini-react

## 使用
- yarn install
- yarn start
- 源代码在 packages, 跑起来的实例在 example, 修改 index.js 即可

## 说明
- 该仓库主要是实现一个 mini 版的 react，所以在整体流程和命名都会尽可能跟 react 保持一致。但是 react 一些函数实现会比较长，为了保持更好的阅读性，会夹杂私货去拆分函数，所以跟 react 对比可能会不一致。
- 虽然现在 react 版本已经到 18 了，但是因为 react 源码太复杂，市面上也很少有实现 react18 的 mini 库。所以选择了有跟多参考资料的 16.13, 这个版本对比最新的 react18 基本的流程，实现并没有太大的改变，所以学习 16.13 算是一个不错的选择
- 抛弃了 ClassComponent，只支持 FunctionComponent

## 已实现功能
- [x] fiber 首屏渲染
- [x] fiber 更新渲染
- [x] hook 支持(useState, useEffect, useLayoutEffect, useCallback)
- [x] key diff, 简单的 props diff
- [x] 合成事件，react合成事件太复杂。所以自己实现了一个简单的合成事件。参考了[这里](https://7kms.github.io/react-illustration-series/main/synthetic-event)
## TODO
- [ ] scheduler 任务调度
- [ ] react 更新的一些优化路径
- [ ] 输出文章


## 参考资料
- [react-on-the-way](https://github.com/BetaSu/react-on-the-way)
- [图解react](https://7kms.github.io/react-illustration-series/)
- [react工作原理](https://pomb.us/build-your-own-react/)
