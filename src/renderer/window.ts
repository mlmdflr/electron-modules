import type {
  IpcRendererEvent,
  BrowserWindowConstructorOptions,
} from "electron";
import type {
  Customize,
  WindowAlwaysOnTopOpt,
  WindowFuncOpt,
  WindowStatusOpt,
} from "../types";

//窗口聚焦失焦监听
export const windowBlurFocusOn = (
  listener: (event: IpcRendererEvent, args: "blur" | "focus") => void,
) => window.ipc.on("window-blur-focus", listener);

//关闭窗口聚焦失焦监听
export const windowBlurFocusRemove = () =>
  window.ipc.removeAllListeners("window-blur-focus");

//窗口大小化监听
export const windowMaximizeOn = (
  listener: (event: IpcRendererEvent, args: "maximize" | "unmaximize") => void,
) => window.ipc.on("window-maximize-status", listener);

//关闭窗口大小化监听
export const windowMaximizeRemove = () =>
  window.ipc.removeAllListeners("window-maximize-status");

//窗口消息监听
export const windowMessageOn = (
  listener: (event: IpcRendererEvent, args: any) => void,
  channel: string = "default",
) => window.ipc.on(`window-message-${channel}-back`, listener);

//关闭窗口消息监听
export const windowMessageRemove = (channel: string = "default") =>
  window.ipc.removeAllListeners(`window-message-${channel}-back`);

//消息发送
export const windowMessageSend = (
  value: any, //需要发送的内容
  acceptIds: number[] = [], //指定窗口id发送
  channel: string = "default", //监听key（保证唯一）
  isback: boolean = false, //是否给自身反馈
) => {
  if (
    "parentId" in window.customize &&
    acceptIds.length === 0 &&
    typeof window.customize.parentId === "number"
  ) {
    acceptIds = [window.customize.parentId];
  }
  window.ipc.send("window-message-send", {
    channel,
    value,
    isback,
    acceptIds,
    id: window.customize.id,
  });
};

//创建窗口
export const windowCreate = (
  customize: Customize,
  opt?: BrowserWindowConstructorOptions,
): Promise<number | bigint> =>
  window.ipc.invoke("window-new", { customize, opt });

//窗口状态
export const windowStatus = (
  id: number | bigint = window.customize.id as number | bigint,
  type: WindowStatusOpt,
): Promise<boolean> => window.ipc.invoke("window-status", { type, id });

//窗口置顶
export const windowAlwaysOnTop = (
  id: number | bigint = window.customize.id as number | bigint,
  is: boolean,
  type?: WindowAlwaysOnTopOpt,
) => window.ipc.send("window-always-top-set", { id, is, type });

//设置窗口大小
export const windowSetSize = (
  size: number[],
  resizable: boolean = true,
  center: boolean = false,
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-size-set", { id, size, resizable, center });

//设置窗口 最大/最小 大小
export const windowSetMaxMinSize = (
  type: "max" | "min",
  size: number | undefined[],
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send(`window-${type}-size-set`, { id, size });

//最大化&最小化当前窗口
export const windowMaxMin = (
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-max-min-size", id);

//关闭窗口
export const windowClose = (
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-close", id);

//窗口显示
export const windowShow = (
  id: number | bigint = window.customize.id as number | bigint,
  time: number = 0,
) =>
  setTimeout(() => window.ipc.send("window-func", { type: "show", id }), time);

//窗口隐藏
export const windowHide = (
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-func", { type: "hide", id });

//最小化窗口
export const windowMin = (
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-func", { type: "minimize", id });

//最大化窗口
export const windowMax = (
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-func", { type: "maximize", id });

//window函数
export const windowFunc = (
  type: WindowFuncOpt,
  data?: any[],
  id: number | bigint = window.customize.id as number | bigint,
) => window.ipc.send("window-func", { type, data, id });

//通过路由获取窗口id (不传route查全部)
export const windowIdRoute = (route?: string): Promise<[]> =>
  window.ipc.invoke("window-id-route", route);

//查询窗体绑定的所有视图
export const windowViewIdAll = (
  id: number | bigint = window.customize.id as number | bigint,
): Promise<number | number[]> =>
  window.ipc.invoke("windows-view-id-all", { id });

//window native hook message
export const windowHookMessageOn = (
  listener: (
    event: IpcRendererEvent,
    args: { wParam: any; lParam: any },
  ) => void,
  channel: string | number,
) => window.ipc.on(`window-hook-message-${channel}`, listener);
