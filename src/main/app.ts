import type { Customize } from "../types";
import { app, ipcMain, shell, nativeTheme } from "electron";
import { resolve } from "node:path";
import { fileOn } from "./file";
import { logError } from "./log.inside";
import { logOn } from "./log";
import { shortcutInstance } from "./shortcut";
import { windowInstance } from "./window";
import { viewInstance } from "./view";
import { globalInstance } from "./global";

class App {
  private static instance: App;

  //关闭硬件加速
  public isDisableHardwareAcceleration: boolean = false;
  // 当运行第二个实例时是否为创建窗口
  public isSecondInstanceWin: boolean = false;
  // 窗口配置
  public windowDefaultCustomize: Customize | undefined = undefined;
  // 窗口参数
  public windowDefaultOpt: Electron.BrowserWindowConstructorOptions = {};

  static getInstance = () => {
    if (!App.instance) App.instance = new App();
    return App.instance;
  };

  constructor() {}

  /**
   * 启动主进程
   */
  start = async () => {
    this.beforeOn();
    // 协议调起
    let argv = [];
    if (!app.isPackaged) argv.push(resolve(process.argv[1]));
    argv.push("--");
    if (!app.isDefaultProtocolClient(app.name, process.execPath, argv))
      app.setAsDefaultProtocolClient(app.name, process.execPath, argv);
    await app.whenReady().catch(logError);
    this.afterOn();
    this.modular();
  };

  /**
   * 必要模块
   */
  modular = () => {
    logOn();
    fileOn();
    shortcutInstance.on();
    globalInstance.on();
    windowInstance.on();
    viewInstance.on();
  };

  /**
   * 监听
   */
  beforeOn = () => {
    //关闭硬件加速
    this.isDisableHardwareAcceleration && app.disableHardwareAcceleration();
    // 默认单例根据自己需要改
    if (!app.requestSingleInstanceLock()) app.quit();
    else {
      app.on("second-instance", (_, argv) => {
        // 当运行第二个实例时是否为创建窗口
        if (!this.isSecondInstanceWin) {
          const main = windowInstance.getMain();
          if (main) {
            if (main.isMinimized()) main.restore();
            main.show();
            main.focus();
          }
          return;
        }
        if (this.windowDefaultCustomize) {
          windowInstance.create(
            {
              ...this.windowDefaultCustomize,
              argv,
            },
            this.windowDefaultOpt
          );
        } else
          app.isPackaged
            ? logError(
                "second-instance >>> windowDefaultCustomize No configuration"
              )
            : console.error(
                "second-instance >>> windowDefaultCustomize No configuration"
              );
      });
    }
    // 渲染进程崩溃监听
    app.on("render-process-gone", (_, webContents, details) =>
      logError(
        "[render-process-gone]",
        webContents.getTitle(),
        webContents.getURL(),
        JSON.stringify(details)
      )
    );
    // 子进程崩溃监听
    app.on("child-process-gone", (_, details) =>
      logError("[child-process-gone]", JSON.stringify(details))
    );
    // 关闭所有窗口退出
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
    nativeTheme.addListener("updated", () => {
      windowInstance.send("socket-back", {
        shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
        shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
        shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
      });
    });
  };

  /**
   * 监听
   */
  afterOn = () => {
    // darwin
    app.on("activate", () => {
      if (windowInstance.getAll().length === 0) {
        if (this.windowDefaultCustomize) {
          windowInstance.create(
            this.windowDefaultCustomize,
            this.windowDefaultOpt
          );
        }
      } else
        app.isPackaged
          ? logError(
              "darwin activate >>> windowDefaultCustomize No configuration"
            )
          : console.error(
              "darwin activate >>> windowDefaultCustomize No configuration"
            );
    });
    // 获得焦点时发出
    app.on("browser-window-focus", () =>
      shortcutInstance.register({
        name: "关闭刷新",
        key: "CommandOrControl+R",
        callback: () => {},
      })
    );
    // 失去焦点时发出
    app.on("browser-window-blur", () =>
      shortcutInstance.unregister("CommandOrControl+R")
    );

    //app常用信息
    ipcMain.handle("app-info-get", () => {
      return {
        name: app.name,
        version: app.getVersion(),
      };
    });
    //app常用获取路径
    ipcMain.handle("app-path-get", (_, args) => {
      if (
        Number(process.versions.electron.split(".")[0]) < 20 &&
        args === "sessionData"
      ) {
        //@ts-ignore
        return app.getPath("cache");
      } else if (
        Number(process.versions.electron.split(".")[0]) > 19 &&
        args === "cache"
      ) {
        return app.getPath("sessionData");
      }
      return app.getPath(args);
    });
    //系統默認打開url
    ipcMain.handle("app-open-url", async (_, args) => shell.openExternal(args));
    //app重启
    ipcMain.on("app-relaunch", (_, args) => {
      app.relaunch({ args: process.argv.slice(1) });
      if (args) app.exit(0);
    });
    //app开机自启
    ipcMain.on(
      "app-launch",
      (event, args) => (event.returnValue = this.autoLaunchSwitch(args))
    );
  };
  /**
   * @description 开机自启开关 有参则设置或关闭开机自启并返回当前开机自启状态 | 无参即立刻返回当前开机自启状态
   * @author 没礼貌的芬兰人
   * @date 2021-09-24 11:56:18
   * @param openAtLogin 是否开启
   * @returns 开机自启状态
   */
  private autoLaunchSwitch = (openAtLogin?: boolean): boolean => {
    if (openAtLogin === undefined)
      return app.getLoginItemSettings().openAtLogin;
    switch (process.platform) {
      case "win32":
        app.setLoginItemSettings({
          openAtLogin: openAtLogin,
        });
        break;
      case "darwin":
        app.setLoginItemSettings({
          openAtLogin: openAtLogin,
          openAsHidden: true,
        });
        break;
      default:
        //其他不做处理
        break;
    }
    return app.getLoginItemSettings().openAtLogin;
  };
}

export const appInstance = App.getInstance();
