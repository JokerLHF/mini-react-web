#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');

// 在 commit-msg 阶段必须传一个 $1, 否则这里拿不到数据：https://juejin.cn/post/7111759355766603784#heading-5
const msgPath = process.argv[2];
const msg = fs.readFileSync(msgPath, 'utf-8').trim();

/**
 * 校验提交信息格式
 * 示例：fix(runtime-core): check if the key is string on undefined property warning (#1731)
 * part1 - 开头关键字：revert|feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release
 * part2 - 括号+冒号+空格 (括号内一般描述修改模块的名称)
 * part3 - 输入一些描述信息 .{1,50}
 */
const commitRE = /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.error(
    `${chalk.bgRed.white(' ERROR ')} \n
     ${chalk.red('commit-message 不符合规范。')}\n\
     ${chalk.green('规范例子: fix(reconcicle): 修复一些 bug')}\n\
     `
  )
  process.exit(1)
}