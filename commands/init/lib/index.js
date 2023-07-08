'use strict';

function init(argv) {
  // TODO
  //   console.log("init", projectName, cmdObj.force, process.env.CLI_TARGET_PATH);

  return new InitCommand(argv);
}
const Command = require('@wiki-cli-dev/command');
const Package = require('@wiki-cli-dev/package');
const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const fse = require('fs-extra');
const semver = require('semver');
const ejs = require('ejs');
const inquirer = require('inquirer');
const log = require('@wiki-cli-dev/log');
const { spinnerStart, execAsync } = require('@wiki-cli-dev/utils');
const getProjectTemplate = require('./getProjectTemplate');
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTORM = 'custom';
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    // console.log("init---",this.force,this.projectName);
    log.verbose('init---', this.force, this.projectName);
  }
  async exec() {
    console.log('exec');
    try {
      this.projectInfo = await this.prepare();
      if (this.projectInfo) {
        await this.downLoadTemplate();
        // 安装模板
        await this.installTemplate();
      }
    } catch (error) {
      log.error(error.message);
    }
  }
  async installTemplate() {
    console.log(this.templateInfo);
    if (this.templateInfo) {
      if (this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTORM) {
        //自定义安装
        this.installCustomTemplate();
      } else {
        throw new Error('无法识别模板类型');
      }
    } else {
      throw new Error('模板信息不存在');
    }
  }
  async ejsRender(ignore) {
    const projectInfo = this.projectInfo;
    const dir = process.cwd();

    return new Promise(async (resolve, reject) => {
      const files = await require('glob').glob('**', {
        cwd: dir,
        ignore: ignore || '',
        nodir: true,
      });
      console.log(files, '--------files');
      if (files) {
        Promise.all(
          files.map((file) => {
            const filePath = path.join(dir, file);
            console.log(projectInfo, '-----projectInfo');
            return new Promise((resolveP, rejectP) => {
              ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                if (err) {
                  rejectP(err);
                } else {
                  fse.writeFileSync(filePath, result);
                  resolveP(result);
                }
              });
            });
          })
        )
          .then(() => {
            resolve();
          })
          .catch((e) => {
            reject(e);
          });
      }
    });
  }
  async installNormalTemplate() {
    console.log('安装标准模板');
    let spinner = spinnerStart('正在安装模板------');
    const templatePath = path.resolve(
      this.templateNpm.cacheFilePath,
      'template'
    );
    try {
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath);
    } catch (error) {
      throw error;
    } finally {
      spinner.stop(true);
      const { installCommand, startCommand } = this.templateInfo;
      const templateIgnore = this.templateInfo.ignore || [];
      const ignore = ['node_modules/**', ...templateIgnore];
      await this.ejsRender(ignore);
      // if (installCommand) {
      //   const installcmd = installCommand.split(' ');
      //   const cmd = installcmd[0];
      //   const args = installcmd.slice(1);
      //   console.log(cmd, args);
      //   const ret = await execAsync(cmd, args, {
      //     stdio: 'inherit',
      //     cwd: process.cwd(),
      //   });
      // }
      // if (startCommand) {
      //   const startCmd = startCommand.split(' ');
      //   const cmd = startCmd[0];
      //   const args = startCmd.slice(1);
      //   console.log(cmd, args);
      //   const ret = await execAsync(cmd, args, {
      //     stdio: 'inherit',
      //     cwd: process.cwd(),
      //   });
      // }
      // console.log(ret);
      console.log('模板安装成功');
    }
  }
  createTemplatChoice() {
    return this.template.map((item) => {
      return { value: item.npmName, name: item.name };
    });
  }
  async downLoadTemplate() {
    console.log(this.template, '--');
    const { projectTemplate } = this.projectInfo;
    console.log(projectTemplate, '---');
    const templateInfo = this.template.find((item) => {
      return item.npmName == projectTemplate;
    });
    this.templateInfo = templateInfo;
    const { npmName, version } = templateInfo;
    const targetPath = path.resolve(userHome, '.wiki-cli-dev', 'template');
    const storeDir = path.resolve(
      userHome,
      '.wiki-cli-dev',
      'template',
      'node_modules'
    );
    const o = {
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    };
    const templateNpm = new Package(o);
    console.log(templateNpm);
    if (!(await templateNpm.exists())) {
      console.log(targetPath, storeDir, '----下载模板');
      const spinner = spinnerStart();
      await templateNpm.install();
      this.templateNpm = templateNpm;
      spinner.stop(true);
    } else {
      console.log(targetPath, storeDir, '----更新模板');
      const spinner = spinnerStart();
      await templateNpm.update();
      this.templateNpm = templateNpm;
      spinner.stop(true);
    }
  }
  async prepare() {
    // 判断模板是否存在
    this.template = await getProjectTemplate();
    if (!this.template || this.template.length <= 0) {
      throw new Error('模板不存在！');
    }
    // 1 判断当前目录是否为空
    const localPath = process.cwd();
    console.log(localPath);
    if (!this.isDirEmpty(localPath)) {
      // 询问是否继续创建
      var ifContinue = false;
      if (!this.force) {
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空是否继续创建目录？',
          })
        ).ifContinue;
      }
      if (!ifContinue) {
        return;
      }
      if (ifContinue || this.force) {
        // 给用户做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件？',
        });
        if (confirmDelete) {
          fse.emptyDirSync(localPath);
        }
      }
    }
    return this.getProjectInfo();
  }
  isDirEmpty(localPath) {
    // path.resolve('.) 获取执行文件 __dirname 当前执行文件目录
    let fileList = fs.readdirSync(localPath);
    // 文件过滤
    fileList = fileList.filter((file) => {
      return !file.startsWith('.') && ['node_modules'].indexOf(file) < 0;
    });
    console.log(localPath);
    return !fileList || fileList.length <= 0;
  }
  async getProjectInfo() {
    let projectInfo = {};
    // 选择创建项目还是组件
    const type = (
      await inquirer.prompt({
        type: 'list',
        name: 'type',
        message: '请选择初始化类型',
        default: TYPE_PROJECT,
        choices: [
          {
            name: '项目',
            value: TYPE_PROJECT,
          },
          {
            name: '组件',
            value: TYPE_COMPONENT,
          },
        ],
      })
    ).type;
    this.template = this.template.filter((template) =>
      template.tag.includes(type)
    );
    let projectPrompt = [
      {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          let done = this.async();
          setTimeout(function () {
            if (
              !/^[a-zA-Z]+([-][A-Za-z][a-zA-Z0-9]*|[_][A-Za-z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                v
              )
            ) {
              done('请输入合法的名称！');
              return;
            }
            done(null, true);
          }, 0);
          // 首字母必须为英文字符
          // 尾字符必须为英文或者数字不能为字符
          // 字符仅仅允许-_
          //   return ;
        },
        filter: function (v) {
          return v;
        },
      },
      {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号',
        default: 'latest',
        validate: function (v) {
          let done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(v)) {
              done('请输入合法的版本号！');
              return;
            }
            done(null, true);
          }, 0);
          //   return !!semver.valid(v);
        },
        filter: function (v) {
          if (!!semver.valid(v)) {
            return semver.valid(v);
          } else {
            return v;
          }
        },
      },
      {
        type: 'list',
        name: 'projectTemplate',
        message: '请选择项目模板',
        choices: this.createTemplatChoice(),
      },
    ];

    // 获取项目基本信息
    if (type == TYPE_PROJECT) {
      let project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
      let descriptionPrompt = {
        type: 'input',
        name: 'description',
        message: '请输入模板描述信息',
        default: 'latest',
        validate: function (v) {
          let done = this.async();
          setTimeout(function () {
            if (!v) {
              done('请输入模板描述信息');
              return;
            }
            done(null, true);
          }, 0);
          //   return !!semver.valid(v);
        },
      };
      projectPrompt.push(descriptionPrompt);
      let component = await inquirer.prompt(projectPrompt);
      projectInfo = {
        type,
        ...component,
      };
    }

    console.log(projectInfo);
    if (projectInfo.projectName) {
      projectInfo.className = require('kebab-case')(
        projectInfo.projectName
      ).replace('/^-/', '');
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }
    if (projectInfo.componentDescription) {
      projectInfo.description = projectInfo.componentDescription;
    }
    // return 项目基本信息
    return projectInfo;
  }
}

module.exports = init;
module.exports.InitCommand = InitCommand;
