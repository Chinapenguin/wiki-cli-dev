"use strict";

module.exports = exec;
const path = require("path");
const cp = require("child_process");
const Packge = require("@wiki-cli-dev/package");
const log = require("@wiki-cli-dev/log");
const {exec:spawn} = require("@wiki-cli-dev/utils");
const settings = {
  init: "lodash",
};
const CACHE_DIR = "dependencies";

async function exec() {
  // TODO
  console.log('start exec');
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let pkg;
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = settings[cmdName];
  const packageVersion = "latest";
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    const storeDir = path.resolve(targetPath, "node_modules");
    console.log(targetPath, storeDir);
    pkg = new Packge({
      targetPath, 
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新
      console.log("更新模板");
      pkg.update();
    } else {
      // 安装
      pkg.install();
    }
  } else {
    pkg = new Packge({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  console.log(rootFile + "rootfile---------");
  if (rootFile) {
    try {
      //   require(rootFile).call(null, Array.from(arguments)); // apply能将数组参数序列化
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key != "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      console.log("oooooooooooooooooooooooooooooooooo");
      args[args.length - 1] = o;
      console.log(args);
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      console.log(code);
      const child = spawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令執行成功", e);
        // process.exit(1);
      });
    } catch (error) {
      log.error(error.message);
    }
  }
}

