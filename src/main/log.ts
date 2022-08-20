import { statSync, writeFileSync, appendFileSync } from "node:fs";
import { sep } from "node:path";
import { app, ipcMain } from "electron";
import { EOL } from "../node/internal.constants";

const logFile: string = app.getPath("logs");

const log = (...val: any) => {
  let data = "";
  val.forEach((e: any) => {
    try {
      if (typeof e === "object") data += JSON.stringify(e);
      else data += e.toString();
    } catch (e) {
      data += e;
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

/**
 * 监听
 */
export const logOn = () => {
  ipcMain.on("log-info", async (_, args) => logInfo(...args));
  ipcMain.on("log-warn", async (_, args) => logWarn(...args));
  ipcMain.on("log-error", async (_, args) => logError(...args));
};
