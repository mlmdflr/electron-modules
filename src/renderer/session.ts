import type { CookiesGetFilter, CookiesSetDetails, Cookie } from "electron";
import type { treatedBytes } from "../comm/utils.inside";

/**
 * 设置http/https指定域名请求头
 * 键值对 => 域名: Headers
 */
export const sessionHeadersSet = (
  urlHeaders: { [key: string]: { [key: string]: string } },
  partition: string = "default"
) => window.ipc.send(`session-headers-set-${partition}`, urlHeaders);

/**
 * 获取 cookies
 */
export const sessionCookiesGet = (
  cookiesGetFilter: CookiesGetFilter,
  partition: string = "default"
): Promise<Cookie[]> =>
  window.ipc.invoke(`session-cookies-get-${partition}`, cookiesGetFilter);

/**
 * 设置 cookies
 */
export const sessionCookiesSet = (
  cookiesGetFilter: CookiesSetDetails,
  partition: string = "default"
): Promise<void> =>
  window.ipc.invoke(`session-cookies-set-${partition}`, cookiesGetFilter);

/**
 * 移除 Cookies
 */
export const sessionCookiesRemove = (
  url: string,
  name: string,
  partition: string = "default"
): Promise<void> =>
  window.ipc.invoke(`session-cookies-remove-${partition}`, { url, name });

/**
 * 获取缓存大小
 */
export const sessionCacheSize = (
  partition: string = "default"
): Promise<treatedBytes> =>
  window.ipc.invoke(`session-cache-size-${partition}`);

/**
 * 清除缓存
 */
export const sessionCacheClear = (
  partition: string = "default"
): Promise<void> => window.ipc.invoke(`session-cache-clear-${partition}`);
