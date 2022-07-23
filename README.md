## 版本信息
- 基于react 17 使用 ts 实现了一个 mini-react

## 使用
- pnpm install
- pnpm start
- 源代码在 packages, 跑起来的实例在 example, 修改 example/index.js 即可

## 说明
- 该仓库主要是实现一个 mini 版的 react，所以在整体流程和命名都会尽可能跟 react 保持一致。但是 react 一些函数实现会比较长，为了保持更好的阅读性，自己会去拆分函数，所以跟 react 对比可能会不一致。
- 虽然现在 react 版本已经到 18 了，但是因为 react 源码太复杂了，市面上也很少有实现 react18 的 mini 库。所以选择了有跟多参考资料的 17, 这个版本对比最新的 react18 基本的流程，实现并没有太大的改变，所以学习 17 算是一个不错的选择
- 抛弃了 ClassComponent，只支持 FunctionComponent
- 因为只是学习使用，所以没有做语法错误处理。

## 已实现功能
- [x] fiber 首屏渲染
- [x] fiber 更新渲染
- [x] hook 支持(useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo)
- [x] key diff, 简单的 props diff
- [x] 合成事件，react合成事件太复杂。所以自己实现了一个简单的合成事件(目前只支持了 onClick 事件)。参考了[这里](https://7kms.github.io/react-illustration-series/main/synthetic-event)
- [x] scheduler 任务调度
- [x] react 更新的一些优化路径（bailout）
- [x] 基于 expirationTime 的 react concurrent 模式（简单的优先级插队以及饥饿现象）。lanes 模型的 concurrent 看不懂......
- [x] 实现简单的 renderToString
- [x] 实现 Fragment, React.memo


## TODO
- [x] ~~scheduler 任务调度~~
- [x] ~~react concurrent 模式~~
- [x] ~~react 更新的一些优化路径（bailout）~~
- [x] ~~增加 concurrent 模式例子，验证代码是否存在 bug~~
- [x] ~~引入 pnpm 替代 npm~~
- [x] ~~完成 useMemo, memo 等API~~
- [x] ~~引入 eslint~~
- [ ] 输出文章
- [ ] 使用 rollup 打包
- [ ] 引入 单元测试



## 学习笔记（持续更新中...）
 - [前言: 了解 react 设计](https://n1pwb3impj.feishu.cn/docx/doxcnF7jdtVE0RJZMGZmK8W2Udf)
 - [了解 react 执行流程](https://n1pwb3impj.feishu.cn/docx/doxcnvaKnQyLHOc09KkY9tt43fh)
 - [了解 react diff 算法](https://n1pwb3impj.feishu.cn/docx/doxcn6NKeR8B3YU70oNLPiG8fme)
 
 
## 参考资料
### react 
- [卡颂 react 技术揭秘](https://react.iamkasong.com/)
- [图解react](https://7kms.github.io/react-illustration-series/)
- [react工作原理](https://pomb.us/build-your-own-react/)
- [react系列文章（强烈推荐）](https://segmentfault.com/blog/react-secret)
### 前端工具
- [husky](https://typicode.github.io/husky/#/)
- [git hooks 钩子](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90)
- [eslint 规则](https://cn.eslint.org/docs/user-guide/getting-started)
