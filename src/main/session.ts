import type { CookiesGetFilter, CookiesSetDetails } from "electron";
import { ipcMain, session } from "electron";
import { bytesToSize } from "@mlmdflr/tools";

/**
 * 监听
 */
export class Session {
  /**
   * 头部 headers
   * 键值对 => 域名: Headers
   */
  public urlHeaders: { [key: string]: { [key: string]: string } } = {};

  constructor() {}

  /**
   * 拦截指定http/https请求并更换、增加headers
   */
  webRequest = () => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      {
        urls: ["http://*/*", "https://*/*"],
      },
      (details, callback) => {
        const keys = Object.keys(this.urlHeaders).filter((key: string) =>
          [0, 7, 8].includes(details.url.indexOf(key))
        );
        for (const key of keys)
          for (const v in this.urlHeaders[key])
            details.requestHeaders[v] = this.urlHeaders[key][v];
        callback({ requestHeaders: details.requestHeaders });
      }
    );
  };

  /**
   * 设置setUserAgent/acceptLanguages
   * @param userAgent
   * @param acceptLanguages
   */
  setUserAgent = (userAgent: string, acceptLanguages?: string) => {
    session.defaultSession.setUserAgent(userAgent, acceptLanguages);
  };

  /**
   * 获取 Cookies
   * @param filter
   */
  getCookies = (filter: CookiesGetFilter) => {
    return session.defaultSession.cookies.get(filter);
  };

  /**
   * 设置 Cookies
   * 如果存在，则会覆盖原先 cookie.
   * @param details
   */
  setCookies = async (details: CookiesSetDetails) => {
    await session.defaultSession.cookies.set(details);
  };

  /**
   * 移除 Cookies
   * @param url
   * @param name
   */
  removeCookies = async (url: string, name: string) => {
    await session.defaultSession.cookies.remove(url, name);
  };

  /**
   * 获取缓存大小
   * @returns treatedBytes {bytes, unit}
   */
  getCacheSize = async () =>
    bytesToSize(await session.defaultSession.getCacheSize());

  /**
   * 清除缓存
   */
  clearCache = () => session.defaultSession.clearCache();

  /**
   * 开启监听
   */
  on = () => {
    this.webRequest();
    //设置url请求头
    ipcMain.on("session-headers-set", async (_, args) => {
      this.urlHeaders = Object.assign(this.urlHeaders, args);
    });
    //设置 Cookies
    ipcMain.handle("session-cookies-set", async (_, args) =>
      this.setCookies(args)
    );
    //获取 Cookies
    ipcMain.handle("session-cookies-get", async (_, args) =>
      this.getCookies(args)
    );
    //移除 Cookies
    ipcMain.handle("session-cookies-remove", async (_, args) =>
      this.removeCookies(args.url, args.name)
    );
    //获取缓存大小
    ipcMain.handle("session-cache-size", async () => this.getCacheSize());
    //清除缓存
    ipcMain.handle("session-cache-clear", async () => this.clearCache());
  };
}
