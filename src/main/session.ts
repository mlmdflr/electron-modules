import type { CookiesGetFilter, CookiesSetDetails } from "electron";
import {
  ipcMain,
  Session as electronSessionType,
  session as electronSession,
} from "electron";
import { bytesToSize } from "@mlmdflr/tools/math";

/**
 * 监听
 */
export class Session {
  /**
   * 头部 headers
   * 键值对 => 域名: Headers
   */
  public urlHeaders: { [key: string]: { [key: string]: string } } = {};

  #session: electronSessionType;

  readonly session: electronSessionType;

  #partition: string;

  readonly partition: string;

  constructor(partition?: string) {
    if (partition) {
      this.#partition = this.partition = partition;
      this.#session = this.session = electronSession.fromPartition(partition);
    } else {
      this.#partition = this.partition = "default";
      this.#session = this.session = electronSession.defaultSession;
    }
  }

  /**
   * 拦截指定http/https请求并更换、增加headers
   */
  webRequest = () => {
    this.#session.webRequest.onBeforeSendHeaders(
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
    this.#session.setUserAgent(userAgent, acceptLanguages);
  };

  /**
   * 获取 Cookies
   * @param filter
   */
  getCookies = (filter: CookiesGetFilter) => this.#session.cookies.get(filter);

  /**
   * 设置 Cookies
   * 如果存在，则会覆盖原先 cookie.
   * @param details
   */
  setCookies = (details: CookiesSetDetails) =>
    this.#session.cookies.set(details);

  /**
   * 移除 Cookies
   * @param url
   * @param name
   */
  removeCookies = (url: string, name: string) =>
    this.#session.cookies.remove(url, name);

  /**
   * 获取缓存大小
   * @returns treatedBytes {bytes, unit}
   */
  getCacheSize = async () => bytesToSize(await this.#session.getCacheSize());

  /**
   * 清除缓存
   */
  clearCache = () => this.#session.clearCache();

  /**
   * 会话保存路径
   */
  getStoragePath = () => this.#session.getStoragePath();

  /**
   * 开启监听
   */
  on = () => {
    this.webRequest();
    //设置url请求头
    ipcMain.on(`session-headers-set-${this.#partition}`, (_, args) => {
      this.urlHeaders = Object.assign(this.urlHeaders, args);
    });
    //设置 Cookies
    ipcMain.handle(`session-cookies-set-${this.#partition}`, (_, args) =>
      this.setCookies(args)
    );
    //获取 Cookies
    ipcMain.handle(`session-cookies-get-${this.#partition}`, (_, args) =>
      this.getCookies(args)
    );
    //移除 Cookies
    ipcMain.handle(`session-cookies-remove-${this.#partition}`, (_, args) =>
      this.removeCookies(args.url, args.name)
    );
    //获取缓存大小
    ipcMain.handle(`session-cache-size-${this.#partition}`, () =>
      this.getCacheSize()
    );
    //清除缓存
    ipcMain.handle(`session-cache-clear-${this.#partition}`, () =>
      this.clearCache()
    );
    //获取会话保存路径
    ipcMain.handle(`session-storage-path-${this.#partition}`, () =>
      this.getStoragePath()
    );
  };
}
