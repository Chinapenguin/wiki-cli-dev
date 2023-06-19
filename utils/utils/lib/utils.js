#! /usr/bin/env node

module.exports = { isObj, spinnerStart, exec, execAsync };

function isObj(o) {
  // TODO
  console.log(Object.prototype.toString.call(o));
  return Object.prototype.toString.call(o) === '[object Object]';
}
function spinnerStart() {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner('loading..%s');
  spinner.setSpinnerString('|/-\\');
  spinner.start();
  return spinner;
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

function execAsync(command, args, options) {
  return new Promise((resovle, reject) => {
    const p = exec(command, args, options);
    p.on('error', (e) => {
      reject(e);
    });
    p.on('exit', (c) => {
      resovle(c);
    });
  });
}
