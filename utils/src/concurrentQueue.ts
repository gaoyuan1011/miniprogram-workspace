
/**
 * 并发队列
 * @param {*} option
 * @param {number} option.taskNum 最大并发量
 * @param {Function} option.done 并发结束回调
 */
type Functions = (...args: unknown[]) => unknown
export function concurrentQueue(option = { taskNum: 5, done: () => {} }) {
  let list: Functions[] = []
  let started = false
  let taskNum = 0
  let count = 0

  function destroy() {
    started = false
    taskNum = 0
    count = 0
    list = []
  }

  function push(fn: Functions) {
    list.push(fn)
    ++count
  }

  function done() {
    --count
    if (count <= 0) {
      taskNum = 0
      if (option.done && typeof option.done === 'function')
        option.done()
    }
  }

  /** 函数执行完成后需要 执行 next函数 */
  function next() {
    --taskNum
    if (!started)
      return
    run()
  }

  /** 队列开始运行 */
  function run() {
    started = true
    while (taskNum < option.taskNum) {
      const fn = list.shift()
      if (typeof fn === 'function') {
        try {
          fn()
        }
        catch (e) {
          console.error(e)
        }
      }
      else {
        break
      }
      ++taskNum
    }
  }

  /** 结束队列运行 */
  function stop() {
    started = false
  }

  return {
    push,
    next,
    run,
    stop,
    done,
    destroy,
  }
}