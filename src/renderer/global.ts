/**
 * 设置全局参数
 * @param key 键
 * @param value 值
 */
export const sendGlobal = async (key: string, value: unknown): Promise<void> =>
  await window.ipc.invoke("global-sharedObject-set", {
    key,
    value,
  });

/**
 * 获取全局参数
 * @param key 键
 */
export const getGlobal = async <T>(key: string): Promise<T> =>
  await window.ipc.invoke("global-sharedObject-get", key);
