import { BrowserWindow, ipcMain } from "electron";
import type { Customize, Customize_View } from "../types";
import { log, write } from "./log.inside";
import { viewInstance } from "./view";

export const logWrapper = (
  type: "info" | "warn" | "error",
  webContentsId?: number,
  ...val: any
) => {
  let customize: Customize | Customize_View | undefined =
    webContentsId !== undefined
      ? BrowserWindow.fromId(webContentsId)?.customize
      : undefined;
  !customize &&
    (customize =
      webContentsId !== undefined
        ? viewInstance.getView(webContentsId)?.customize
        : undefined);
  customize &&
    write(
      type,
      `${JSON.stringify(customize, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )} start`
    );
  write(type, log(...val));
  customize &&
    write(
      type,
      `${JSON.stringify(customize, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )} end`
    );
};

/**
 * 监听
 */
export const logOn = () => {
  ipcMain.on("log-info", async (event, args) =>
    logWrapper("info", event.sender.id, ...args)
  );
  ipcMain.on("log-warn", async (event, args) =>
    logWrapper("warn", event.sender.id, ...args)
  );
  ipcMain.on("log-error", async (event, args) =>
    logWrapper("error", event.sender.id, ...args)
  );
  ipcMain.on("dev-log-info", async (_, args) => console.log(log(...args)));
  ipcMain.on("dev-log-warn", async (_, args) => console.warn(log(...args)));
  ipcMain.on("dev-log-error", async (_, args) => console.error(log(...args)));
};
