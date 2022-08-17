import type { MakeDirectoryOptions } from "fs";

/**
 * 读取目录下指定后缀文件
 * @param path
 * @param fileName
 */
export const fileBySuffix = async (path: string, fileName: string) =>
  await window.ipc.invoke("file-filebysuffix", { path, fileName });

/**
 * 创建目录和内部文件
 * */
export const mkdir = async (path: string, options?: MakeDirectoryOptions) =>
  await window.ipc.invoke("file-mkdir", { path, options });

/**
 * 删除目录和内部文件
 * */
export const delDir = async (path: string) =>
  await window.ipc.invoke("file-deldir", { path });

/**
 * 删除文件
 * */
export const unlink = async (path: string) =>
  await window.ipc.invoke("file-unlink", { path });

/**
 * 检查文件是否存在于当前目录中、以及是否可写
 * @return 0 不存在 1 只可读 2 存在可读写
 */
export const access = async (path: string) =>
  await window.ipc.invoke("file-access", { path });
/**
 * 文件重命名
 * @return 0 失败 1 成功
 */
export const rename = async (path: string, newPath: string) =>
  await window.ipc.invoke("file-rename", { path, newPath });

/**
 * 读取整个文件
 * @param path 文件路径
 * @param options 选项
 */
export const readFile = async (
  path: string,
  options?: { encoding?: BufferEncoding; flag?: string }
) => await window.ipc.invoke("file-readfile", { path, options });

/**
 * 逐行读取
 * @param path
 * @param index
 */
export const readLine = async (
  path: string,
  index?: number
): Promise<string | any[]> =>
  await window.ipc.invoke("file-readline", { path, index });
/**
 * 覆盖数据到文件
 * @return 0 失败 1 成功
 */
export const writeFile = async (
  path: string,
  data: string | Buffer,
  options?: { encoding?: BufferEncoding; mode?: number | string; flag?: string }
) => await window.ipc.invoke("file-writefile", { path, data, options });

/**
 * 追加数据到文件
 * @return 0 失败 1 成功
 */
export const appendFile = async (
  path: string,
  data: string | Uint8Array,
  options?: { encoding?: BufferEncoding; mode?: number | string; flag?: string }
) => await window.ipc.invoke("file-appendfile", { path, data, options });
