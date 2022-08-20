import type { AppInfo, AppPathKey } from "../types";

/**
 * app自启
 * @param once 是否开启
 */
export const launch = (once?: boolean): boolean =>
  window.ipc.sendSync("app-launch", once);
/**
 * app重启
 * @param once 是否立即重启
 */
export const relaunch = (once: boolean): void =>
  window.ipc.send("app-relaunch", once);

/**
 * app打开url
 */
export const openUrl = (url: string): Promise<void> =>
  window.ipc.invoke("app-open-url", url);

/**
 * app常用信息
 * @returns
 */
export const getAppInfo = (): Promise<AppInfo> =>
  window.ipc.invoke("app-info-get");

/**
 * app常用获取路径
 */
export const getAppPath = (key: AppPathKey): Promise<string> =>
  window.ipc.invoke("app-path-get", key);
