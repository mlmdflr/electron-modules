import type { IpcRendererEvent } from "electron";
import { contextBridge, ipcRenderer } from "electron";
import type {
  Ipc,
  Customize_Route,
  Customize_View,
  Environment,
  PlatformPath,
} from "../types";
import { posix, win32 } from "../node/path";
import {
  EOL,
  isWindows,
  isUsingAsar,
  systemVersion,
  platform,
} from "../node/environment";
import { sleep, Snowflake } from "../comm/utils.inside";

declare global {
  interface Window {
    ipc: Ipc;
    customize: Customize_Route | Customize_View;
    environment: Environment;
    path?: PlatformPath;
  }
}

// not node
export const preloadInit = (defaultEnv?: { [key: string]: any }) => {
  // ipcRender
  contextBridge.exposeInMainWorld("ipc", {
    send: (channel: string, args?: any) => ipcRenderer.send(channel, args),
    sendSync: (channel: string, args?: any) =>
      ipcRenderer.sendSync(channel, args),
    on: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => ipcRenderer.on(channel, listener),
    once: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => ipcRenderer.once(channel, listener),
    invoke: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
    removeAllListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel),
  });

  // node path module
  contextBridge.exposeInMainWorld("path", isWindows ? win32 : posix);

  // customized environment
  contextBridge.exposeInMainWorld("environment", {
    EOL,
    platform,
    isUsingAsar,
    systemVersion,
    ...defaultEnv,
  });
};

// url preload
export const urlPreloadInit = (defaultEnv?: { [key: string]: any }) => {
  preloadInit(defaultEnv);
  //挂载休眠方法
  contextBridge.exposeInMainWorld("Sleep", (duration: number, value: any) =>
    sleep(duration, value),
  );
  //挂载雪花算法
  contextBridge.exposeInMainWorld(
    "Snowflake",
    (workerId: bigint, dataCenterId: bigint) =>
      new Snowflake(workerId, dataCenterId).nextId(),
  );
};
