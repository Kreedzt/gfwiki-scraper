/**
 * @type {Array<Worker>}
 */
const tasks = [];
const addExitTask = fn => tasks.push(fn);

const exitAllTask = async () => {
  /**
   * @type {Array<Promise>}
   */
  const terminatedPromise = [];
  tasks.forEach(ins => {
    terminatedPromise.push(new Promise((res, rej) => {
      ins.on('message', (msg) => {

        if (msg === 'exited') {
          ins.terminate();
        }
      });
      ins.postMessage('exit');
    }));
  });

  await Promise.all(terminatedPromise);
}

exports.exitAllTask = exitAllTask;

const handleExit = async (code, error) => {
  console.log('handleExit', code, error);

  await exitAllTask();

  process.exit(0);
};

const registerProcessExit = () => {
  // 监听各种退出事件
  process.on('exit', code => handleExit(code));
  // 按照 POSIX 的规范，我们用 128 + 信号编号 得到最终的退出码
  // 信号编号参考下面的图片，大家可以在 linux 系统下执行 kill -l 查看所有的信号编号
  process.on('SIGHUP', () => handleExit(128 + 1));
  process.on('SIGINT', () => handleExit(128 + 2));
  process.on('SIGTERM', () => handleExit(128 + 15));
  // windows 下按下 ctrl+break 的退出信号
  process.on('SIGBREAK', () => handleExit(128 + 21));
  // 退出码 1 代表未捕获的错误导致进程退出
  process.on('uncaughtException', error => handleExit(1, error));
  process.on('unhandledRejection', error => handleExit(1, error));
}

exports.registerProcessExit = registerProcessExit;

/**
 * @param ins {Worker}
 */
const registerTaskExit = (ins) => {
  tasks.push(ins);
}

exports.registerTaskExit = registerTaskExit;
