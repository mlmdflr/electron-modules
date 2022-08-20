import type { CookiesGetFilter, CookiesSetDetails, Cookie } from "electron";
import type { treatedBytes } from "@mlmdflr/tools";

/**
 * 设置http/https指定域名请求头
 * 键值对 => 域名: Headers
 */
export const sessionHeadersSet = (args: {
  [key: string]: { [key: string]: string };
}) => window.ipc.send("session-headers-set", args);

/**
 * 获取 cookies
 * @param args
 */
export const sessionCookiesGet = (args: CookiesGetFilter): Promise<Cookie[]> =>
  window.ipc.invoke("session-cookies-get", args);

/**
 * 设置 cookies
 * @param args
 */
export const sessionCookiesSet = (args: CookiesSetDetails): Promise<void> =>
  window.ipc.invoke("session-cookies-set", args);

/**
 * 移除 Cookies
 * @param url
 * @param name
 */
export const sessionCookiesRemove = (
  url: string,
  name: string
): Promise<void> => window.ipc.invoke("session-cookies-remove", { url, name });

/**
 * 获取缓存大小
 */
export const sessionCacheSize = (): Promise<treatedBytes> =>
  window.ipc.invoke("session-cache-size");

/**
 * 清除缓存
 */
export const sessionCacheClear = (): Promise<void> =>
  window.ipc.invoke("session-cache-clear");
