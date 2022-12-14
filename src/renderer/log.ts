/**
 * 日志(info)
 * @param args
 */
export const logInfo = (...args: any): void =>
  window.ipc.send("log-info", args);

/**
 * 日志(warn)
 * @param args
 */
export const logWarn = (...args: any): void =>
  window.ipc.send("log-warn", args);

/**
 * 日志(error)
 * @param args
 */
export const logError = (...args: any): void =>
  window.ipc.send("log-error", args);

/**
 * 只输出至控制台的日志
 * @param args
 */
export const devLogInfo = (...args: any): void =>
  window.ipc.send("dev-log-info", args);

export const devLogWarn = (...args: any): void =>
  window.ipc.send("dev-log-warn", args);

export const devLogError = (...args: any): void =>
  window.ipc.send("dev-log-error", args);
