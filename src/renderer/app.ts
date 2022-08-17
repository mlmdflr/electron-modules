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
export const openUrl = async (url: string): Promise<void> =>
  await window.ipc.invoke("app-open-url", url);

/**
 * app常用信息
 * @returns
 */
export const getAppInfo = async (): Promise<AppInfo> =>
  await window.ipc.invoke("app-info-get");

/**
 * app常用获取路径
 */
export const getAppPath = async (key: AppPathKey): Promise<string> =>
  await window.ipc.invoke("app-path-get", key);
