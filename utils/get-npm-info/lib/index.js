/*
 * @Author: panda.com
 * @Date: 2022-05-26 14:26:29
 * @LastEditors: panda.com
 * @LastEditTime: 2022-05-26 15:29:04
 * @FilePath: \wiki-cli-dev\utils\get-npm-info\lib\index.js
 */
"use strict";

module.exports = {
  getSemverVersions,
  getNpmInfo,
  getNpmVersions,
  getDefaultRegistry,
  getNpmLatestVersion,
};

const semver = require("semver");
const urlJoin = require("url-join");
const axios = require("axios");
function getNpmInfo(pkgName, registry) {
  // TODO
  console.log(pkgName);
  if (!pkgName) {
    return null;
  }
  const realRegistry = registry || getDefaultRegistry(true);
  const npmInfoUrl = urlJoin(realRegistry, pkgName);
  console.log(npmInfoUrl);
  return axios
    .get(npmInfoUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}
async function getNpmVersions(pkgName, registry) {
  const data = await getNpmInfo(pkgName);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}
async function getSemverVersions(baseVersion, pkgName, registry) {
  let versions = await getNpmVersions(pkgName, registry);
  let newVersions = versions
    .filter((version) => {
      console.log(semver.satisfies(version, `^${baseVersion}`));
      return semver.satisfies(version, `^${baseVersion}`);
    })
    .sort((a, b) => semver.gt(b, a));
  //   console.log(newVersions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
}
async function getNpmLatestVersion(npmName, registry) {
  console.log(npmName+'--123')
  const versions = await getNpmVersions(npmName, registry);
  if (versions) {
    console.log(versions.sort((a, b) => {
      return semver.gt(a, b) ? -1 : 1;
    }),'version-------')

    return versions.sort((a, b) => {
      return semver.gt(a, b);
    })[0];
  }
  return null
}
function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? "https://registry.npmjs.org"
    : "https://registry.npm.taobao.org";
}
