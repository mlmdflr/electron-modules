import type {
  BrowserWindowConstructorOptions,
  LoadFileOptions,
  LoadURLOptions,
  Session,
  WebContents,
} from "electron";
import type {
  Customize,
  ExtraOptions,
  WindowFuncOpt,
  WindowStatusOpt,
  Customize_Route,
  WindowAlwaysOnTopOpt,
} from "../types";
import { join } from "node:path";
import { app, screen, ipcMain, BrowserWindow } from "electron";
import { logError } from "./log.inside";
import { Snowflake } from "../comm/utils.inside";

declare global {
  module Electron {
    interface BrowserWindow {
      customize: Customize;
    }

    interface BrowserWindowConstructorOptions {
      customize?: Customize;
    }
  }
}

/**
 * 窗口配置
 * @param customize
 * @param bwOptions
 * @returns
 */
function browserWindowAssembly(
  customize: Customize,
  bwOptions: BrowserWindowConstructorOptions = {}
) {
  if (!customize) throw new Error("not customize");
  //重置主窗体
  if (
    customize.isMainWin &&
    customize.parentId !== undefined &&
    customize.parentId !== null
  )
    customize.isMainWin = false;
  const main = windowInstance.getMain();
  if (
    main &&
    main.customize.isMainWin &&
    customize.isMainWin &&
    (customize.parentId === undefined || customize.parentId === null)
  )
    main.customize.isMainWin = false;

  bwOptions.minWidth = bwOptions.minWidth || bwOptions.width;
  bwOptions.minHeight = bwOptions.minHeight || bwOptions.height;

  // darwin下modal会造成整个窗口关闭(?)
  if (process.platform === "darwin") delete bwOptions.modal;
  customize.silenceFunc = customize.silenceFunc || false;
  customize.isPackaged = app.isPackaged;
  const isLocal = "route" in customize;
  bwOptions.webPreferences = Object.assign(
    {
      preload: isLocal
        ? windowInstance.defaultRoutePreload
        : windowInstance.defaultUrlPreload,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
      webSecurity: false,
    },
    bwOptions.webPreferences
  );
  let bwOpt: BrowserWindowConstructorOptions = Object.assign(
    {
      autoHideMenuBar: true,
      titleBarStyle: !isLocal ? "default" : "hidden",
      minimizable: true,
      maximizable: true,
      frame: bwOptions.frame === undefined ? !isLocal : bwOptions.frame,
      show: bwOptions.show === undefined ? !isLocal : bwOptions.show,
    },
    bwOptions
  );
  let parenWin: BrowserWindow | null = null;
  customize.parentId !== null &&
    customize.parentId !== undefined &&
    (parenWin = windowInstance.get(customize.parentId));
  if (parenWin) {
    bwOpt.parent = parenWin;
    const currentWH = bwOpt.parent.getBounds();
    customize.currentWidth = currentWH.width;
    customize.currentHeight = currentWH.height;
    customize.currentMaximized = bwOpt.parent.isMaximized();
    if (customize.currentMaximized) {
      const displayWorkAreaSize = screen.getPrimaryDisplay().workAreaSize;
      bwOpt.x = ((displayWorkAreaSize.width - (bwOpt.width || 0)) / 2) | 0;
      bwOpt.y = ((displayWorkAreaSize.height - (bwOpt.height || 0)) / 2) | 0;
    } else {
      const currentPosition = bwOpt.parent.getPosition();
      bwOpt.x =
        (currentPosition[0] +
          (currentWH.width - (bwOpt.width || customize.currentWidth)) / 2) |
        0;
      bwOpt.y =
        (currentPosition[1] +
          (currentWH.height - (bwOpt.height || customize.currentHeight)) / 2) |
        0;
    }
  }

  return {
    bwOpt,
    isParentId: customize.parentId !== null && customize.parentId !== undefined,
    parenWin,
  };
}

/**
 * 窗口打开预处理
 * window.open 是不可预知的
 */
export function windowOpenHandler(
  webContents: WebContents,
  bwOpt: BrowserWindowConstructorOptions,
  parentId?: number
) {
  webContents.setWindowOpenHandler(
    ({ url, frameName, features, disposition, referrer, postBody }) => {
      //放弃继承
      delete bwOpt?.webPreferences?.preload;
      let winId = windowInstance.create(
        {
          url,
          parentId,
          data: {
            frameName,
            features,
            disposition,
            referrer,
            postBody,
          },
        },
        Object.assign(bwOpt, {
          frame: true,
          titleBarStyle: "default",
          resizable: true,
          webPreferences: {
            sandbox: true,
            devTools: false,
            webSecurity: true,
            contextIsolation: true,
            nodeIntegration: false,
            session: webContents.session,
          },
        })
      );
      winId !== undefined && windowInstance.get(winId)?.setMenu(null);
      return { action: "deny" };
    }
  );
}

/**
 * 窗口加载
 */
function load(
  url: string,
  win: BrowserWindow,
  bwOpt: BrowserWindowConstructorOptions
) {
  // 窗口内创建拦截
  windowInstance.defaultExtraOptions.isSetWindowOpenHandler &&
    windowOpenHandler(win.webContents, bwOpt, win.id);
  windowInstance.defaultExtraOptions.isSetWindowOpenHandler &&
    win.webContents.on("did-attach-webview", (_, webContents) =>
      windowOpenHandler(webContents, bwOpt, win.id)
    );
  // 窗口usb插拔消息监听
  process.platform === "win32" &&
    win.hookWindowMessage(0x0219, (wParam, lParam) =>
      win.webContents.send("window-hook-message-0x0219", { wParam, lParam })
    );
  win.webContents.on("did-finish-load", () => {
    if ("route" in win.customize)
      win.webContents.send(`load-route`, win.customize);
    else win.webContents.send(`load-url`, win.customize);
  });
  // 窗口最大最小监听
  win.on("maximize", () =>
    win.webContents.send("window-maximize-status", "maximize")
  );
  win.on("unmaximize", () =>
    win.webContents.send("window-maximize-status", "unmaximize")
  );
  // 聚焦失焦监听
  win.on("blur", () => win.webContents.send("window-blur-focus", "blur"));
  win.on("focus", () => win.webContents.send("window-blur-focus", "focus"));

  if (url.startsWith("https://") || url.startsWith("http://"))
    win
      .loadURL(url, win.customize.loadOptions as LoadURLOptions)
      .catch(logError);
  else
    win
      .loadFile(url, win.customize.loadOptions as LoadFileOptions)
      .catch(logError);
  return win.customize.id as number | bigint;
}

export interface WindwoDefaultCfg {
  defaultLoadUrl?: string;
  defaultRoutePreload?: string;
  defaultUrlPreload?: string;
  defaultExtraOptions?: ExtraOptions;
}

export class Window {
  private static instance: Window;

  //  此项保留私有，不允许外部访问
  #insertCSSMap: Map<string, string>;

  // html加载路径
  public defaultLoadUrl: string = join(__dirname, "../renderer/index.html");

  // 默认路由预加载路径
  public defaultRoutePreload: string = join(
    __dirname,
    "../preload/index.route.js"
  );

  // 默认url预加载路径
  public defaultUrlPreload: string = join(__dirname, "../preload/index.url.js");

  // 默认配置
  public defaultExtraOptions: ExtraOptions = {
    modalWindowParentBlu: 5,
    win32HookMsg278Delay: 32,
    isSetWindowOpenHandler: true,
  };

  static getInstance = () => {
    if (!Window.instance) Window.instance = new Window();
    return Window.instance;
  };

  constructor() {
    this.#insertCSSMap = new Map();
  }

  setDefaultCfg = (cfg: WindwoDefaultCfg = {}) => {
    cfg.defaultLoadUrl && (this.defaultLoadUrl = cfg.defaultLoadUrl);
    cfg.defaultRoutePreload &&
      (this.defaultRoutePreload = cfg.defaultRoutePreload);
    cfg.defaultUrlPreload && (this.defaultUrlPreload = cfg.defaultUrlPreload);
    cfg.defaultExtraOptions &&
      (this.defaultExtraOptions = Object.assign(
        this.defaultExtraOptions,
        cfg.defaultExtraOptions
      ));
  };

  /**
   * 获取窗口
   * @param id 窗口id
   * @constructor
   */
  get = (id: number | bigint) => {
    const all = this.getAll();
    for (let key in all) if (all[key].customize.id === id) return all[key];
    return null;
  };

  /**
   * 获取全部窗口
   */
  getAll = () => BrowserWindow.getAllWindows().filter((win) => win.customize);

  /**
   * 获取主窗口(无主窗口获取后存在窗口)
   */
  getMain = () => {
    const all = this.getAll().reverse();
    let win: BrowserWindow | null = null;
    for (let index = 0; index < all.length; index++) {
      const item = all[index];
      if (index === 0) win = item;
      if (item.customize.isMainWin) {
        win = item;
        break;
      }
    }
    return win;
  };
  /**
   * @description 检查id是否已经存在
   * @author 没礼貌的芬兰人
   * @date 2021-09-25 10:53:32
   * @param id
   */
  checkId = (id: number | bigint): boolean => {
    for (const wins of this.getAll())
      if (wins.customize.id === id) return false;
    return true;
  };

  /**
   * 创建窗口
   * */
  create = (
    customize: Customize,
    bwOptions: BrowserWindowConstructorOptions = {}
  ): number | bigint => {
    if ("route" in customize && !customize.isOpenMultiWindow) {
      for (const i of this.getAll()) {
        if (
          i.customize &&
          "route" in i.customize &&
          customize.route &&
          customize.route === i.customize.route
        ) {
          i.focus();
          return i.customize.id!;
        }
      }
    }
    const { bwOpt, isParentId, parenWin } = browserWindowAssembly(
      customize,
      bwOptions
    );
    /**
     * @description 设置id时如果已经有了则是默认雪花算法生成
     * @author 没礼貌的芬兰人
     * @date 2021-09-25 11:54:59
     */
    if (
      customize.id !== undefined &&
      customize.id !== null &&
      !windowInstance.checkId(customize.id as number | bigint)
    )
      customize.id = new Snowflake(0n, 0n).nextId();

    const win = new BrowserWindow(bwOpt);

    //win32 取消原生窗口右键事件
    process.platform === "win32" &&
      win.hookWindowMessage(278, () => {
        win.setEnabled(false);
        setTimeout(
          () => win.setEnabled(true),
          this.defaultExtraOptions.win32HookMsg278Delay
        );
      });

    //子窗体关闭父窗体获焦 https://github.com/electron/electron/issues/10616
    isParentId && win.once("close", () => parenWin?.focus());

    // 参数设置
    !customize.argv && (customize.argv = process.argv);

    win.customize = {
      id: new Snowflake(0n, 0n).nextId(),
      ...customize,
    };

    //主窗口关闭程序尝试退出,可在 beforeunload中取消
    win.customize.isMainWin &&
      win.on("close", () => win.customize.isMainWin && app.quit());

    // 模态框弹出父窗体模糊
    if (win.isModal() && win.customize.parentId) {
      let pwin = this.get(win.customize.parentId);
      if (pwin) {
        pwin.webContents
          .insertCSS(
            `html{filter:blur(${this.defaultExtraOptions.modalWindowParentBlu}px);}`
          )
          .then((key) =>
            windowInstance.#insertCSSMap.set(
              `${win.getParentWindow()?.customize.id ?? "default"}`,
              key
            )
          );
        for (const bv of pwin.getBrowserViews())
          bv.webContents
            .insertCSS(
              `html{filter:blur(${this.defaultExtraOptions.modalWindowParentBlu}px);}`
            )
            .then((key) =>
              windowInstance.#insertCSSMap.set(`v${bv.customize.id}`, key)
            );
      }
    }
    // 调试打开 DevTools
    !app.isPackaged && win.webContents.openDevTools({ mode: "detach" });
    if ("url" in win.customize) {
      if (
        !win.customize.url.startsWith("https://") &&
        !win.customize.url.startsWith("http://")
      ) {
        app.isPackaged
          ? (win.customize.url = "https://" + win.customize.url)
          : (win.customize.url = "http://" + win.customize.url);
      }
      return load(win.customize.url, win, bwOpt);
    }
    return load(this.defaultLoadUrl, win, bwOpt);
  };

  /**
   * 窗口关闭、隐藏、显示等常用方法
   */
  func = (type: WindowFuncOpt, id?: number, data?: any[]) => {
    if (id !== null && id !== undefined) {
      const win = this.get(id as number);
      if (!win) throw Error(`not found this window -> ${id}`);
      // @ts-ignore
      data ? win[type](...data) : win[type]();
      return;
    }
    // @ts-ignore
    if (data)
      for (const i of this.getAll()) {
        // @ts-ignore
        !i.customize.silenceFunc && i[type](...data);
      }
    else for (const i of this.getAll()) !i.customize.silenceFunc && i[type]();
  };

  /**
   * 窗口发送消息
   */
  send = (key: string, value: any, id?: number) => {
    if (id !== null && id !== undefined) {
      const win = this.get(id as number);
      if (win) win.webContents.send(key, value);
    } else for (const i of this.getAll()) i.webContents.send(key, value);
  };

  /**
   * 窗口状态
   */
  getStatus = (type: WindowStatusOpt, id: number | bigint) => {
    const win = this.get(id);
    if (!win) throw Error(`not found this window -> ${id}`);
    return win[type]();
  };

  /**
   * 设置窗口最小大小
   */
  setMinSize = (args: { id: number | bigint; size: number[] }) => {
    const win = this.get(args.id);
    if (!win) throw Error(`not found this window -> ${args.id}`);
    const workAreaSize = args.size[0]
      ? { width: args.size[0], height: args.size[1] }
      : screen.getPrimaryDisplay().workAreaSize;
    win.setMaximumSize(workAreaSize.width, workAreaSize.height);
  };

  /**
   * 设置窗口最大大小
   */
  setMaxSize = (args: { id: number | bigint; size: number[] }) => {
    const win = this.get(args.id);
    if (!win) throw Error(`not found this window -> ${args.id}`);
    win.setMaximumSize(args.size[0], args.size[1]);
  };

  /**
   * 设置窗口大小
   */
  setSize = (args: {
    id: number | bigint;
    size: number[];
    resizable: boolean;
    center: boolean;
  }) => {
    let Rectangle: { [key: string]: number } = {
      width: args.size[0] | 0,
      height: args.size[1] | 0,
    };
    const win = this.get(args.id);
    if (!win) throw Error(`not found this window -> ${args.id}`);
    const winBounds = win.getBounds();
    if (
      Rectangle.width === winBounds.width &&
      Rectangle.height === winBounds.height
    )
      return;
    if (!args.center) {
      const winPosition = win.getPosition();
      Rectangle.x = (winPosition[0] + (winBounds.width - args.size[0]) / 2) | 0;
      Rectangle.y =
        (winPosition[1] + (winBounds.height - args.size[1]) / 2) | 0;
    }
    win.once("resize", () => {
      if (args.center) win.center();
    });
    win.setResizable(args.resizable);
    win.setMinimumSize(Rectangle.width, Rectangle.height);
    win.setBounds(Rectangle);
  };

  /**
   * 设置窗口背景色
   */
  setBackgroundColor = (args: { id: number | bigint; color: string }) => {
    const win = this.get(args.id);
    if (!win) throw Error(`not found this window -> ${args.id}`);
    win.setBackgroundColor(args.color);
  };

  /**
   * 设置窗口是否置顶
   */
  setAlwaysOnTop = (args: {
    id: number | bigint;
    is: boolean;
    type?: WindowAlwaysOnTopOpt;
  }) => {
    const win = this.get(args.id);
    if (!win) throw Error(`not found this window -> ${args.id}`);
    win.setAlwaysOnTop(args.is, args.type || "normal");
  };

  /**
   * 开启监听
   */
  on = () => {
    // 窗口数据更新
    ipcMain.on("window-update", (event, args) => {
      if (args?.id) {
        const win = this.get(args.id);
        if (!win) throw Error(`not found this window -> ${args.id}`);
        win.customize = args;
      }
    });

    // 最大化最小化窗口
    ipcMain.on("window-max-min-size", (event, id) => {
      if (id !== null && id !== undefined) {
        const win = this.get(id);
        if (!win) throw Error(`not found this window -> ${id}`);
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
      }
    });
    // 窗口消息
    ipcMain.on("window-func", (event, args) =>
      this.func(args.type, args.id, args.data)
    );
    //窗口消息-关闭(内置为主窗体关闭则全部退出)
    ipcMain.on("window-close", (event, args) => {
      let win: BrowserWindow | null = null;
      if (args !== undefined && args !== null) {
        win = this.get(args as number | bigint);
        if (!win) throw Error(`not found this window -> ${args}`);
        //模态框关闭父窗体恢复
        if (win.isModal() && win.customize.parentId) {
          let parentWin = this.get(win.customize.parentId),
            mapValue = windowInstance.#insertCSSMap.get(
              `${parentWin?.customize.id ?? "default"}`
            ),
            vMapGet = (key: string) =>
              windowInstance.#insertCSSMap.get(
                key === "vundefined" ? "default" : key
              ) as string;
          if (parentWin && mapValue) {
            parentWin.webContents.removeInsertedCSS(mapValue);
            for (const bv of parentWin.getBrowserViews())
              vMapGet(`v${bv.customize.id}`) &&
                bv.webContents.removeInsertedCSS(
                  vMapGet(`v${bv.customize.id}`)
                );
          }
        }
        win.close();
      }
    });
    // 窗口状态
    ipcMain.handle("window-status", async (event, args) =>
      this.getStatus(args.type, args.id)
    );
    // 创建窗口
    ipcMain.handle("window-new", (event, args) =>
      this.create(args.customize, args.opt)
    );
    // 设置窗口是否置顶
    ipcMain.on("window-always-top-set", (event, args) =>
      this.setAlwaysOnTop(args)
    );
    // 设置窗口大小
    ipcMain.on("window-size-set", (event, args) => this.setSize(args));
    // 设置窗口最小大小
    ipcMain.on("window-min-size-set", (event, args) => this.setMinSize(args));
    // 设置窗口最大大小
    ipcMain.on("window-max-size-set", (event, args) => this.setMaxSize(args));
    // 设置窗口背景颜色
    ipcMain.on("window-bg-color-set", (event, args) =>
      this.setBackgroundColor(args)
    );
    // 窗口消息
    ipcMain.on("window-message-send", (event, args) => {
      const channel = `window-message-${args.channel}-back`;
      if (args.acceptIds && args.acceptIds.length > 0) {
        for (const i of args.acceptIds) this.send(channel, args.value, i);
        return;
      }
      if (args.isback) this.send(channel, args.value);
      else
        for (const win of this.getAll())
          if (win.id !== args.id) win.webContents.send(channel, args.value);
    });
    //通过路由获取窗口id (不传route查全部)
    ipcMain.handle("window-id-route", (event, args) => {
      return this.getAll()
        .filter((win) => win.customize && "route" in win.customize)
        .filter((win) =>
          args ? (win.customize as Customize_Route).route === args : true
        )
        .map((win) => win.customize.id);
    });
    /**
     * 查询所有窗体id(过滤掉route窗体)
     */
    ipcMain.handle("window-id-all", (event, args) => {
      return this.getAll()
        .filter((win) => win.customize && "url" in win.customize)
        .map((win) => win.customize.id);
    });
    /**
     * 查询绑定此窗体的所有视图
     */
    ipcMain.handle("windows-view-id-all", (_, args) => {
      if (args.id !== undefined && args.id !== null) {
        const win = this.get(args.id);
        if (!win) throw Error(`not found this window -> ${args.id}`);
        if (win.customize)
          switch (win.customize.viewType) {
            case "None":
              return;
            case "Single":
              let view = win.getBrowserView();
              if (view && view.customize) return view.customize.id;
              break;
            case "Multiple":
              return win
                .getBrowserViews()
                .filter((view) => view.customize)
                .map((view) => view.customize.id);
          }
      }
      return;
    });
  };
}

export const windowInstance = Window.getInstance();
