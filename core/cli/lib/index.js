/*
 * @Author: panda.com
 * @Date: 2022-05-25 16:34:07
 * @LastEditors: panda.com
 * @LastEditTime: 2022-05-26 15:29:27
 * @FilePath: \wiki-cli-dev\core\cli\lib\index.js
 */
module.exports = core;
const path = require("path");
const userHome = require("user-home"); //解析路径
const pathExist = require("path-exists").sync; //判断路径是否存在
const semver = require("semver"); //比较版本号
const rootcheck = require("root-check"); //用户权限检测
const commander = require("commander")
const colors = require("colors/safe");
const pkg = require("../package.json");
const log = require("@wiki-cli-dev/log");
// const init = require("@wiki-cli-dev/init");
const exec = require("@wiki-cli-dev/exec");
const cosntant = require("./const");
let args, config;
const program = new commander.Command();

async function core() {
  // TODO

  try {
    // console.log("exec core");
    await prepare()
    registerCommander();
    // log.verbose("debug", "test debug log");
  } catch (error) {
    log.error(error.message);
  }
}
function registerCommander(){
  program
  .name(Object.keys(pkg.bin)[0])
  .usage('<command> [options]')
  .version(pkg.version)
  .option('-d, --debug', '是否开启debug模式', false)
  .option('-tp , --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program.command('init [projectName]')
  .option('-f, --force', '是否强制初始化')
  .action(exec)
  program.on('option:debug', function(){
    // log.error(JSON.stringify(program));
    // console.log(program);
    if(program.debug){
      process.env.LOG_LEVEL = "verbose";
    }else{
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL; // log初始化在require的时候 后续修改需要手动
    log.verbose('test')
  })
  program.on('option:targetPath', function(){
   console.log(program.targetPath, '-----1')
   process.env.CLI_TARGET_PATH = program.targetPath;
  })

  program.on('command:*',function(obj){
    // console.log(obj)
    const availableCommands = program.commands.map( (cmd) => {
      return cmd.name()
    })
    
    if(availableCommands.length > 0){
      console.log(colors.red('可用命令：') + availableCommands.join(','))
    }
    
  })
  // console.log(program);
  if(process.args && process.args.length < 1){
    program.outputHelp()
  }else{
    program.parse(process.argv)
  }
  
}
async function prepare(){
  try {
    checkVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    // checkInputAgv();
    checkEnv();
    checkGlobalUpdate();
  } catch (error) {
    log.error(error.message);
  }
}
async function checkGlobalUpdate() {
  //获取当前版本号和名称
  const currentVersion = pkg.version;
  const pkgName = pkg.name;
  //获取所有版本号
  const { getSemverVersions } = require("@wiki-cli-dev/get-npm-info");
  const lastVersion = await getSemverVersions(currentVersion, pkgName);
  if(lastVersion && semver.gt(lastVersion, currentVersion)){
      log.warn(colors.yellow(`请及时更新${pkgName}`))
  }
}

function checkEnv() {
  const dotenv = require("dotenv"); //读取环境变量
  console.log(userHome,'userHome---------------------')
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExist(dotenvPath)) {
    dotenv.config({ path: dotenvPath });
  }
  config = createDefaultCliConfig();
  // config = dotenv.config({})
  log.verbose("debug", config);
}
function createDefaultCliConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, cosntant.DEFAULT_CLI_CONFIG);
  }
  console.log(cliConfig,'cliConfig------------------')
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  // process.env.CLI_HOME_PATH = 'cache';
  return cliConfig;
}
function checkInputAgv() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2));
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL; // log初始化在require的时候 后续修改需要手动
}
function checkUserHome() {
  console.log(userHome,'userhome');
  if (!userHome || !pathExist(userHome)) {
    throw new Error(colors.red(`当前登录用户主目录不存在！`));
  }
}
function checkRoot() {
  // console.log(process.geteuid());
  rootcheck(); // 会降级用户权限 因为如果都是root用户会在操作文件是权限受阻
}

function checkVersion() {
  console.log(pkg.version);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = cosntant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`wiki-cli 需要安装 v${lowestVersion} 以上的版本的 Node.js`)
    );
  }
  console.log(process.version);
}
