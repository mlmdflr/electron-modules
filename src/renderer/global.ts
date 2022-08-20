/**
 * 设置全局参数
 * @param key 键
 * @param value 值
 */
export const sendGlobal = (key: string, value: unknown): Promise<void> =>
  window.ipc.invoke("global-sharedObject-set", {
    key,
    value,
  });

/**
 * 获取全局参数
 * @param key 键
 */
export const getGlobal = <T>(key: string): Promise<T> =>
  window.ipc.invoke("global-sharedObject-get", key);
