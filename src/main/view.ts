import { app, BrowserView, BrowserWindow, ipcMain, session } from "electron";
import type {
  Rectangle,
  WebPreferences,
  LoadURLOptions,
  LoadFileOptions,
  AutoResizeOptions,
  BrowserViewConstructorOptions,
} from "electron";
import { Snowflake } from "@mlmdflr/tools";
import { windowInstance, windowOpenHandler } from "./window";
import { logError } from "./log";
import type { Customize_View } from "../types";

declare global {
  module Electron {
    interface BrowserView {
      customize: Customize_View;
    }
  }
}

async function load(
  url: string,
  view: BrowserView,
  bvOptions: BrowserViewConstructorOptions
) {
  windowOpenHandler(view.webContents, bvOptions);
  view.webContents.on("did-attach-webview", (_, webContents) =>
    windowOpenHandler(webContents, bvOptions)
  );
  // 注入初始化代码
  view.webContents.on("did-finish-load", () => {
    if ("route" in view.customize)
      view.webContents.send(`load-route`, view.customize);
    else view.webContents.send(`load-url`, view.customize);
  });
  //页面加载
  if (url.startsWith("https://") || url.startsWith("http://"))
    await view.webContents
      .loadURL(url, view.customize.loadOptions as LoadURLOptions)
      .catch(logError);
  else
    await view.webContents
      .loadFile(url, view.customize.loadOptions as LoadFileOptions)
      .catch(logError);
  return view.webContents.id;
}

class View {
  private static instance: View;

  #view_map: Map<string, BrowserView>;

  static getInstance() {
    if (!View.instance) View.instance = new View();
    return View.instance;
  }

  constructor() {
    this.#view_map = new Map();
  }

  private browserViewAssembly = (
    customize: Customize_View,
    bvOptions: BrowserViewConstructorOptions = {}
  ) => {
    if (!customize) throw new Error("not customize");
    if (!customize.session) throw new Error("not customize session");
    const isLocal = "route" in customize;
    const sesIsPersistence = customize.session.persistence ?? false;
    const sesCache = customize.session.cache ?? false;
    let sesKey = customize.session.key;
    //sesKey is default
    const sesIsDefault = sesKey.toLowerCase() === "default";
    !sesKey && (sesKey = new Snowflake(0n, 0n).nextId().toString());
    sesKey =
      sesIsPersistence && !sesKey.startsWith("persist:")
        ? `persist:${customize.session.key}`
        : `${customize.session.key}`;
    bvOptions.webPreferences = Object.assign(
      {
        preload: isLocal
          ? windowInstance.defaultRoutePreload
          : windowInstance.defaultUrlPreload,
        contextIsolation: true,
        nodeIntegration: false,
        devTools: !app.isPackaged,
        webSecurity: false,
        session: sesIsDefault
          ? session.defaultSession
          : session.fromPartition(sesKey, { cache: sesCache }),
      },
      bvOptions.webPreferences
    );
    const view = new BrowserView(bvOptions);
    customize.id = view.webContents.id;
    view.customize = customize;
    viewInstance.#view_map.set(`${customize.id}`, view);
    return { view, bvOptions };
  };

  /**
   * 创建視圖
   */
  create = async (customize: Customize_View, opt: WebPreferences) => {
    const { view, bvOptions } = this.browserViewAssembly(customize, {
      webPreferences: opt,
    });
    // 调试打开 DevTools
    !app.isPackaged && view.webContents.openDevTools({ mode: "detach" });
    if ("route" in view.customize)
      return load(windowInstance.defaultLoadUrl, view, bvOptions);
    else return load(view.customize.url, view, bvOptions);
  };

  setBounds = (id: number, bounds: Rectangle) => {
    let view = this.#view_map.has(`${id}`) && this.#view_map.get(`${id}`);
    view && view.customize.mount && view.setBounds(bounds);
  };

  /**
   * 設置背景顔色
   */
  setBackgroundColor = (args: { id: number; color: string }) => {
    const view = this.#view_map.get(`${args.id}`);
    if (!view) throw Error(`viewId Invalid ${args.id}`);
    view.setBackgroundColor(args.color);
  };

  /**
   * 設置自動調整大小
   */
  setAutoResize = (args: { id: number; autoResize: AutoResizeOptions }) => {
    const view = this.#view_map.get(`${args.id}`);
    if (!view) throw Error(`viewId Invalid ${args.id}`);
    view.setAutoResize(args.autoResize);
  };

  unBindBV = (win: BrowserWindow, view: BrowserView, del: boolean = false) => {
    let err = new Error(`BrowserWindow unbind error`);
    switch (win.customize.viewType) {
      case "Multiple":
        if (!("customize" in view)) {
          err.message += "\nwindow is Multiple >>> view is not customize";
          throw err;
        }
        let prViews = win.getBrowserViews();
        let vids = [view]
          .filter((view) => view.customize)
          .map((view) => view.customize.id);
        for (const v of prViews)
          v.customize &&
            vids.includes(v.customize.id) &&
            v.customize.mount &&
            !(v.customize.mount = false) &&
            ((win.removeBrowserView(v) as undefined) || true) &&
            del &&
            this.#view_map.delete(`${v.customize.id}`) &&
            //@ts-ignore
            v.webContents.destroy();
        break;
      case "Single":
        if (!("customize" in view)) {
          err.message += "\nwindow is Single >>> view is not customize";
          throw err;
        }
        let prView = win.getBrowserView();
        "customize" in view &&
          prView &&
          prView.customize &&
          prView.customize.mount &&
          prView.customize.id === view.customize.id &&
          !(prView.customize.mount = false) &&
          ((win.setBrowserView(null) as undefined) || true) &&
          del &&
          this.#view_map.delete(`${prView.customize.id}`) &&
          //@ts-ignore
          prView.webContents.destroy();
        break;
      default:
        throw err;
    }
  };

  bindBV = (win: BrowserWindow, view: BrowserView, bounds: Rectangle) => {
    this.unBindBV(win, view);
    let err = new Error(
      `this BrowserWindow cannot bind,please check window customize`
    );
    if (win.customize && win.customize.viewType)
      switch (win.customize.viewType) {
        case "Single":
          win.setBrowserView(view);
          view.customize.mount = true;
          break;
        case "Multiple":
          win.addBrowserView(view);
          view.customize.mount = true;
          break;
        default:
          throw err;
      }
    else {
      throw err;
    }
    bounds && this.setBounds(view.customize.id as number, bounds);
  };

  createBindBV = async (
    winId: bigint | number,
    customize: Customize_View,
    opt: WebPreferences,
    bounds: Rectangle
  ) => {
    let win = windowInstance.get(winId);
    if (!win) throw Error("Invalid id, the id can not be a empty");
    const id = await this.create({ ...customize, mount: false }, opt);
    this.bindBV(win, this.#view_map.get(`${id}`) as BrowserView, bounds);
    return id;
  };

  on() {
    //创建视图
    ipcMain.handle("view-new", (_, args) =>
      this.create(args.customize, args.opt)
    );

    //视图绑定
    ipcMain.handle("view-bind", (_, args) => {
      const view = this.#view_map.get(`${args.id}`);
      const win = windowInstance.get(args.wid);
      if (!view) throw Error(`viewId Invalid ${args.id}`);
      if (!win) throw Error(`WinId Invalid ${args.wid}`);
      this.bindBV(win, view, args.bounds);
    });

    //视图解绑
    ipcMain.handle("view-un-bind", (_, args) => {
      const win = windowInstance.get(args.wid);
      const view = this.#view_map.get(`${args.id}`);
      if (!view) throw Error(`viewId Invalid ${args.id}`);
      if (!win) throw Error(`WinId Invalid ${args.wid}`);
      this.unBindBV(win, view, args.del);
    });

    //视图销毁
    ipcMain.handle("view-destroy", (event, args) => {
      const view = this.#view_map.get(`${args.id}`);
      if (!view) throw Error(`viewId Invalid ${args.id}`);
      //@ts-ignore
      view.webContents.destroy();
      return this.#view_map.delete(`${args.id}`);
    });

    //设置 bounds
    ipcMain.handle("view-set-bounds", (_, args) =>
      this.setBounds(args.id, args.bounds)
    );

    //创建并绑定
    ipcMain.handle("view-create-bind", (_, args) =>
      this.createBindBV(args.wid, args.customize, args.opt, args.bounds)
    );

    //view数据更新
    ipcMain.on("view-update", (_, args) => {
      if (args.id !== undefined && args.id !== null) {
        const view = this.#view_map.get(args.id);
        if (!view) throw Error(`viewId Invalid ${args.id}`);
        view.customize = args;
      }
    });

    //设置背景颜色
    ipcMain.on("view-bg-color-set", (_, args) => this.setBackgroundColor(args));

    //设置是否自动调整大小
    ipcMain.on("view-set-auto-resize", (_, args) => this.setAutoResize(args));

    //view消息(指定发送)
    ipcMain.on("view-message-send", (event, args) => {
      let originId = event.sender.id;
      if (args.acceptIds && args.acceptIds.length > 0) {
        for (let i of args.acceptIds) {
          let view = this.#view_map.get(`${i}`);
          if (view && i !== `${originId}`)
            view.webContents.send(
              `view-message-${args.channel}-back`,
              args.value
            );
        }
      }
      if (args.isback) {
        let view = this.#view_map.get(`${originId}`);
        if (view)
          view.webContents.send(
            `view-message-${args.channel}-back`,
            args.value
          );
      }
    });

    //view消息(全部发送)
    ipcMain.on("view-message-send-all", (event, args) => {
      let originId = event.sender.id;
      for (let [key, value] of this.#view_map)
        if (key !== `${originId}`)
          value.webContents.send(
            `window-message-${args.channel}-back`,
            args.value
          );
      if (args.isback) {
        let view = this.#view_map.get(`${originId}`);
        if (view)
          view.webContents.send(
            `view-message-${args.channel}-back`,
            args.value
          );
      }
    });
  }
}

export const viewInstance = View.getInstance();
