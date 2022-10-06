import { ipcMain } from "electron";
import { logError } from "./log.inside";
import { readFile } from "./file";

type Obj<Value> = {} & {
  [key: string]: Value | Obj<Value>;
};

interface Config {
  path: string;
  seat: string;
  parse: boolean;
  opt?: { encoding?: BufferEncoding; flag?: string };
}

/**
 * Global
 */
class Global {
  private static instance: Global;

  public sharedObject: { [key: string]: any } = {};

  static getInstance = () => {
    if (!Global.instance) Global.instance = new Global();
    return Global.instance;
  };

  constructor() {}

  /**
   * 挂载配置
   * @param path 配置文件路径
   * @param seat 存放位置
   * @param parse 是否parse
   * @param opt
   */
  use = async (conf: Config | Config[]) => {
    if (Array.isArray(conf)) {
      for (let index = 0; index < conf.length; index++) {
        const c = conf[index];
        try {
          const cfg = (await readFile(
            c.path,
            c.opt || { encoding: "utf-8" }
          )) as any;
          if (cfg) this.sendGlobal(c.seat, c.parse ? JSON.parse(cfg) : cfg);
        } catch (e) {
          logError(`[cfg ${c.path}]`, e);
        }
      }
    } else {
      try {
        const cfg = (await readFile(
          conf.path,
          conf.opt || { encoding: "utf-8" }
        )) as any;
        if (cfg) this.sendGlobal(conf.seat, conf.parse ? JSON.parse(cfg) : cfg);
      } catch (e) {
        logError(`[cfg ${conf.path}]`, e);
      }
    }
  };

  /**
   * 开启监听
   */
  on = () => {
    //赋值(sharedObject)
    ipcMain.handle("global-sharedObject-set", (_, args) => {
      return this.sendGlobal(args.key, args.value);
    });
    //获取(sharedObject)
    ipcMain.handle("global-sharedObject-get", (_, key) => {
      return this.getGlobal(key);
    });
  };

  getGlobal = <Value>(key: string): Value | undefined => {
    if (key === "") {
      console.error("Invalid key, the key can not be a empty string");
      return;
    }

    if (
      !key.includes(".") &&
      Object.prototype.hasOwnProperty.call(this.sharedObject, key)
    ) {
      return this.sharedObject[key] as Value;
    }

    const levels = key.split(".");
    let cur = this.sharedObject;
    for (const level of levels) {
      if (Object.prototype.hasOwnProperty.call(cur, level)) {
        cur = cur[level] as unknown as Obj<Value>;
      } else {
        return;
      }
    }

    return cur as unknown as Value;
  };

  sendGlobal = <Value>(
    key: string,
    value: Value,
    exists: boolean = false
  ): void => {
    if (key === "") {
      console.error("Invalid key, the key can not be a empty string");
      return;
    }

    if (!key.includes(".")) {
      if (
        Object.prototype.hasOwnProperty.call(this.sharedObject, key) &&
        exists
      ) {
        console.warn(`The key ${key} looks like already exists on obj.`);
      }
      this.sharedObject[key] = value;
    }

    const levels = key.split(".");
    const lastKey = levels.pop()!;

    let cur = this.sharedObject;
    for (const level of levels) {
      if (Object.prototype.hasOwnProperty.call(cur, level)) {
        cur = cur[level];
      } else {
        console.error(
          `Cannot set value because the key ${key} is not exists on obj.`
        );
        return;
      }
    }

    if (typeof cur !== "object") {
      console.error(
        `Invalid key ${key} because the value of this key is not a object.`
      );
      return;
    }
    if (Object.prototype.hasOwnProperty.call(cur, lastKey) && exists) {
      console.warn(`The key ${key} looks like already exists on obj.`);
    }
    cur[lastKey] = value;
  };
}

export const globalInstance = Global.getInstance();
