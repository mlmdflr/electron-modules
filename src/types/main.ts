import { LoadURLOptions, LoadFileOptions } from "electron";

export interface Customize_Base {
  // 唯一id
  id?: number | bigint;
  // 参数数据
  loadOptions?: LoadURLOptions | LoadFileOptions;
  // 父类窗口宽度
  currentWidth?: number;
  // 父类窗口高度
  currentHeight?: number;
  // 是否已打包环境
  isPackaged?: boolean;
  // 自定义参数
  data?: any;
}

export type Customize_Window_Base = Customize_Base & {
  // 父类窗口是否全屏
  currentMaximized?: boolean;
  // 是否主窗口(当为true时会替代当前主窗口)
  isMainWin?: boolean;
  // 父窗口id
  parentId?: number | bigint;
  // 进程参数
  argv?: any;
  // 窗口不触发广播func
  silenceFunc?: boolean;
};

export type Customize_Route = Customize_Window_Base & {
  // 标题 (仅路由下生效)
  title?: string;
  // 指定路由
  route: string;
  // 放开一路一窗限制
  isOpenMultiWindow?: boolean;
};

export type Customize_Url = Customize_Window_Base & {
  // 指定网页
  url: string;
};

export type Customize = Customize_Route | Customize_Url;

export type Customize_View_Base = Customize_Base & {
  // 唯一id (view is webContents.id)
  id?: number;
  // 会话
  session: {
    // 区分会话的key
    key: string;
    // 是否开启缓存
    cache?: boolean;
    // 是否持久化会话
    persistence?: boolean;
  };
  mount?: boolean;
};

export type Customize_View_Omit =
  | "id"
  | "currentWidth"
  | "currentHeight"
  | "currentMaximized"
  | "isMainWin"
  | "parentId"
  | "silenceFunc"
  | "argv";

export type Customize_View_Route = Customize_View_Base &
  Omit<Customize_Route, Customize_View_Omit>;

export type Customize_View_Url = Customize_View_Base &
  Omit<Customize_Url, Customize_View_Omit>;

export type Customize_View = Customize_View_Route | Customize_View_Url;

export interface ExtraOptions {
  [key: string]: any;
  //模态框背景模糊值(单位px)
  modalWindowParentBlu?: number;
  win32HookMsg278Delay?: number;
  isSetWindowOpenHandler?: boolean;
}

export interface AppInfo {
  name: string;
  version: string;
}

export type AppPathKey =
  | "home"
  | "appData"
  | "userData"
  | "cache"
  | "sessionData"
  | "temp"
  | "exe"
  | "module"
  | "desktop"
  | "documents"
  | "downloads"
  | "music"
  | "pictures"
  | "videos"
  | "recent"
  | "logs"
  | "crashDumps";

export type WindowAlwaysOnTopOpt =
  | "normal"
  | "floating"
  | "torn-off-menu"
  | "modal-panel"
  | "main-menu"
  | "status"
  | "pop-up-menu"
  | "screen-saver";

export type WindowFuncOpt =
  | "close"
  | "hide"
  | "show"
  | "minimize"
  | "maximize"
  | "restore"
  | "reload";

export type WindowStatusOpt =
  | "isMaximized"
  | "isMinimized"
  | "isFullScreen"
  | "isAlwaysOnTop"
  | "isVisible"
  | "isFocused"
  | "isModal";

export type ClipboardType = "selection" | "clipboard";

export interface UpdateMessage {
  code: number;
  msg: string;
  value?: any;
}

export type Accelerator = {
  // 名称
  name: string;
  key: string | string[];
  callback: () => void;
};
