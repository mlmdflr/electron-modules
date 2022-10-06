import { statSync, writeFileSync, appendFileSync } from "node:fs";
import { sep } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { EOL } from "node:os";
import type { Customize, Customize_View } from "../types";
import { viewInstance } from "./view";

const logFile: string = app.getPath("logs");

const log = (...val: any) => {
  let data = "";
  val.forEach((e: any) => {
    try {
      if (typeof e === "object") data += JSON.stringify(e) + " ";
      else data += e.toString() + " ";
    } catch (e) {
      data += e + " ";
    }
  });
  return data;
};

const write = (type: string, data: string) => {
  const date = new Date();
  const path =
    logFile +
    `${sep}${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}.${type}.log`;
  const str = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] [${type}] ${data}${EOL}`;
  try {
    statSync(path);
  } catch (e) {
    writeFileSync(path, str);
    return;
  }
  appendFileSync(path, str);
};

/**
 * error错误
 * @param val
 */
export const logError = (...val: any) => write("error", log(val));

/**
 * info警告
 * @param val
 */
export const logWarn = (...val: any) => write("warn", log(val));
/**
 * info日志
 * @param val
 */
export const logInfo = (...val: any) => write("info", log(val));

const logWrapper = (
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
