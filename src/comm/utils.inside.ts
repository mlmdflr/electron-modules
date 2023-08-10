export function queryParams(data: any): string {
  let _result = [];
  for (let key in data) {
    let value = data[key];
    if (["", undefined, null].includes(value)) {
      continue;
    }
    if (value.constructor === Array) {
      value.forEach((_value) => {
        _result.push(
          encodeURIComponent(key) + "[]=" + encodeURIComponent(_value),
        );
      });
    } else {
      _result.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return _result.length ? _result.join("&") : "";
}

export class Snowflake {
  private static twepoch = 1658110470937n;

  private static maxWorkerId: bigint = -1n ^ (-1n << 5n);
  private static maxDataCenterId: bigint = -1n ^ (-1n << 5n);
  private static sequenceMask: bigint = -1n ^ (-1n << 12n);

  private static workerIdShift: bigint = 12n;
  private static dataCenterIdShift: bigint = 17n;
  private static timestampLeftShift: bigint = 22n;

  private static sequence: bigint = 0n;
  private static lastTimestamp: bigint = -1n;
  private static workerId: bigint;
  private static dataCenterId: bigint;

  constructor(workerId: bigint, dataCenterId: bigint) {
    if (workerId > Snowflake.maxWorkerId || workerId < 0n)
      throw new Error(
        `workerId can't be greater than ${Snowflake.maxWorkerId} or less than 0`,
      );
    if (dataCenterId > Snowflake.maxDataCenterId || dataCenterId < 0n)
      throw new Error(
        `dataCenterId can't be greater than ${Snowflake.maxDataCenterId} or less than 0`,
      );
    Snowflake.workerId = workerId;
    Snowflake.dataCenterId = dataCenterId;
    return this;
  }
  public nextId(): bigint {
    let timestamp = Snowflake.currentLinuxTime();
    const diff = timestamp - Snowflake.lastTimestamp;
    if (diff < 0n)
      throw new Error(
        `Clock moved backwards. Refusing to generate id for ${-diff} milliseconds`,
      );
    if (diff === 0n) {
      Snowflake.sequence = (Snowflake.sequence + 1n) & Snowflake.sequenceMask;
      if (Snowflake.sequence === 0n) {
        timestamp = Snowflake.tilNextMillis(Snowflake.lastTimestamp);
      }
    } else Snowflake.sequence = 0n;
    Snowflake.lastTimestamp = timestamp;
    return (
      ((timestamp - Snowflake.twepoch) << Snowflake.timestampLeftShift) |
      (Snowflake.dataCenterId << Snowflake.dataCenterIdShift) |
      (Snowflake.workerId << Snowflake.workerIdShift) |
      Snowflake.sequence
    );
  }
  public static tilNextMillis(lastTimeStamp: bigint) {
    let timestamp: bigint = Snowflake.currentLinuxTime();
    while (timestamp <= lastTimeStamp) timestamp = Snowflake.currentLinuxTime();
    return timestamp;
  }
  private static currentLinuxTime(): bigint {
    return BigInt(new Date().valueOf());
  }
}

/**
 * 深拷贝
 * @param obj
 */
export function deepCopy<T>(obj: any): T {
  const isArray = Array.isArray(obj);
  let result: any = {};
  if (isArray) result = [];
  let temp = null;
  let key = null;
  let keys = Object.keys(obj);
  keys.map((item, _) => {
    key = item;
    temp = obj[key];
    if (temp && typeof temp === "object") {
      if (isArray) result.push(deepCopy(temp));
      else result[key] = deepCopy(temp);
    } else {
      if (isArray) result.push(temp);
      else result[key] = temp;
    }
  });
  return result;
}

/**
 * @description 休眠方法
 * @author 没礼貌的芬兰人
 * @date 2021-10-06 17:12:24
 * @param duration 休眠的毫秒数
 * @param value
 * @returns
 */
export function sleep<T>(duration: number, value?: T): Promise<T> {
  let durationInMilliseconds: number;
  if (!isFinite(duration) || Math.floor(duration) !== duration || duration < 0)
    return Promise.reject("duration must be a non-negative integer");
  durationInMilliseconds = duration;
  return new Promise((resolve): any =>
    setTimeout(() => {
      resolve(value as T);
    }, durationInMilliseconds),
  );
}

const units = [
  "B",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
  "BB",
  "NB",
  "DB",
] as const;

type unit = (typeof units)[number];

export type treatedBytes = { bytes: number; unit: unit };

/**
 * bytes 向上转换为单位
 * @param bytes 字节数
 */
export function bytesToSize(bytes: number): treatedBytes {
  if (bytes === 0) return { bytes: 0, unit: units[0] };
  let k: number = 1024,
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    bytes:
      Math.round((bytes / Math.pow(k, i)) * Math.pow(10, 1)) / Math.pow(10, 1),
    unit: units[i],
  };
}
