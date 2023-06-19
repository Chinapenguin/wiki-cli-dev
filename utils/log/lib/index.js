/*
 * @Author: panda.com
 * @Date: 2022-05-25 16:58:51
 * @LastEditors: panda.com
 * @LastEditTime: 2022-05-25 17:31:25
 * @FilePath: \wiki-cli-dev\utils\log\lib\index.js
 */
'use strict';

const npmlog = require('npmlog')
npmlog.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
module.exports = npmlog;

