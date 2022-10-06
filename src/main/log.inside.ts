import { write, log } from "./log";

/**
 * error错误
 * @param val
 */
export const logError = (...val: any) => write("error", log(val));

/**
 * info警告
 * @param val
 */
export const logWarn = (...val: any) => write("warn", log(val));
/**
 * info日志
 * @param val
 */
export const logInfo = (...val: any) => write("info", log(val));
