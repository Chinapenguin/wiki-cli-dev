"use strict";
const path = require("path");
const fse = require("fs-extra");
// 用于安装包
const npmInstall = require("npminstall");
const pathExists = require("path-exists").sync;
const { isObj } = require("@wiki-cli-dev/utils");
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require("@wiki-cli-dev/get-npm-info");
const formatPath = require("@wiki-cli-dev/format-path");
const pkgDir = require("pkg-dir").sync;
class Package {
  constructor(opthions) {
    console.log("packge constructor");
    if (!opthions) {
      throw new Error("pakage类的参数不能为空");
    }
    console.log(isObj);
    if (!isObj(opthions)) {
      throw new Error("pakage类的参数必须是对象");
    }
    console.log(opthions)
    this.targetPath = opthions.targetPath;
    this.storeDir = opthions.storeDir;
    this.packageName = opthions.packageName;
    this.packageVersion = opthions.packageVersion;
    // 缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }
  // 用于获取最新版本号
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion == "latest") {
      console.log(this.packageName,'packageName------');
      this.packageVersion = await getNpmLatestVersion(this.packageName);
      console.log(this.packageVersion)
    }
    console.log(this.packageVersion + "----------------------");
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }
  getSpecificCacheFilePath(version) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    );
  }
  // 判断当前package是否存在
  async exists() {
    console.log(this.storeDir + "------exists");
    if (this.storeDir) {
      //  todo
      await this.prepare();
      console.log(this.cacheFilePath + "----ppp");
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  // 安装依赖
  install() {
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(true),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }
  async update() {
    await this.prepare();
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    console.log("update-------" + latestPackageVersion);
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    console.log("update-------" + latestFilePath);
    if (!pathExists(latestFilePath)) {
      return npmInstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegistry(true),
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
      });
    }
    this.packageVersion = latestPackageVersion;
  }
  // 获取文件入口路径
  getRootFilePath() {
    function getRootFile(filePath) {
      // 获取package.json路径
      const dir = pkgDir(filePath);

      // 读取json  require（） 支持js node json 其余按js处理
      if (dir) {
        const pkgFile = require(path.resolve(dir, "package.json"));
        console.log(pkgFile);
        // 找到main/lib 找到入口
        if (pkgFile && pkgFile.main) {
          console.log(dir, "------------dir");
          console.log(formatPath(path.resolve(dir, pkgFile.main)))
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
    }
    if (this.storeDir) {
      return getRootFile(this.cacheFilePath);
    } else {
      return getRootFile(this.targetPath);
    }

    // 路径兼容
    // return null;
  }
}

module.exports = Package;
