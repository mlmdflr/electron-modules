import type {
  IpcRendererEvent,
  AutoResizeOptions,
  Rectangle,
  WebPreferences,
} from "electron";
import type { Customize_View } from "../types";

//视图消息监听
export const viewMessageOn = (
  channel: string,
  listener: (event: IpcRendererEvent, args: any) => void
) => window.ipc.on(`view-message-${channel}-back`, listener);

//关闭视图消息监听
export const viewMessageRemove = (channel: string) =>
  window.ipc.removeAllListeners(`view-message-${channel}-back`);

/**
 * 指定视图消息发送
 * @param channel 监听key（保证唯一）
 * @param value 需要发送的内容
 * @param isback 是否给自身反馈(默认false)
 * @param acceptIds 指定视图id发送(
 */
export const viewMessageSend = (
  channel: string, //监听key（保证唯一）
  value: any, //需要发送的内容
  isback: boolean = false, //是否给自身反馈
  acceptIds: number[] = [] //指定视图id发送
) =>
  window.ipc.send("view-message-send", {
    channel,
    value,
    isback,
    acceptIds,
  });

/**
 * 给所有视图发送消息
 * @param channel 监听key（保证唯一）
 * @param value 需要发送的内容
 * @param isback 是否给自身反馈(默认false)
 */
export const viewMessageSendAll = (
  channel: string,
  value: any,
  isback: boolean = false
) =>
  window.ipc.send("view-message-send-all", {
    channel,
    value,
    isback,
  });

//创建视图
export const viewCreate = (
  customize: Customize_View,
  opt?: WebPreferences
): Promise<number> => window.ipc.invoke("view-new", { customize, opt });

//新建并绑定
export const viewCreateBind = (
  wid: number | bigint,
  customize: Customize_View,
  bounds?: Rectangle,
  opt?: WebPreferences
): Promise<number> =>
  window.ipc.invoke("view-create-bind", { wid, customize, opt, bounds });

//绑定视图
export const viewBind = (
  wid: number | bigint,
  id: number,
  bounds?: Rectangle
): Promise<void> => window.ipc.invoke("view-bind", { wid, id, bounds });

//视图销毁
export const viewDestroy = (id: number): Promise<boolean> =>
  window.ipc.invoke("view-destroy", { id });

//视图解绑
export const viewUnBind = (
  wid: number | bigint | undefined,
  id: number,
  del?: boolean
): Promise<void> => window.ipc.invoke("view-un-bind", { wid, id, del });

// 设置视图bounds
export const viewSetBounds = (
  id: number = window.customize.id as number,
  bounds: Rectangle
): Promise<void> => window.ipc.invoke("view-set-bounds", { id, bounds });

//设置自动调整
export const viewSetAutoResize = (
  id: number = window.customize.id as number,
  autoResize: AutoResizeOptions
) => window.ipc.send("view-set-auto-resize", { id, autoResize });
