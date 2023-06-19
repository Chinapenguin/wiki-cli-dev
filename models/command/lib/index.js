"use strict";
const log = require("@wiki-cli-dev/log");
const { isObj } = require("@wiki-cli-dev/utils");
const semver = require("semver");
const colors = require("colors/safe");
const LOWEST_NODE_VERSION = "12.0.0";

class Command {
  // TODO
  constructor(argv) {
    console.log("command", argv);
    if (!argv) {
      throw new Error("参数不能为空！");
    }
    if (!Array.isArray(argv) || argv.length < 1) {
      throw new Error("参数必须是数组且不能为空！");
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {
        this.checkNodeVersion();
      });
      chain = chain.then(() => {
        this.initArgs();
      });
      chain = chain.then(() => {
        this.init();
      });
      chain = chain.then(() => {
        this.exec();
      });
      chain.catch((err) => {
        log.error(err.message);
      });
    });
  }
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`wiki-cli 需要安装 v${lowestVersion} 以上的版本的 Node.js`)
      );
    }
    console.log(process.version);
  }
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    console.log('-------------------');
    console.log(this._cmd, this._argv);
  }
  init() {
    throw new Error("init 必须实现");
  }
  exec() {
    throw new Error("exec 必须实现");
  }
}

module.exports = Command;
