import type { IpcRendererEvent } from "electron";
import type { Accelerator } from "../types";

/**
 * 快捷键监听
 * @param listener
 */
export const shortcutOn = (
  listener: (event: IpcRendererEvent, args: any) => void
) => window.ipc.on(`shortcut-back`, listener);

/**
 * 注册快捷键 (重复注册将覆盖)
 * @param name
 * @param key
 */
export const shortcut = async (
  name: string,
  key: string | string[]
): Promise<void> => await window.ipc.invoke("shortcut-register", { name, key });

/**
 * 清除快捷键
 * @param key
 */
export const unShortcut = async (key: string): Promise<void> =>
  await window.ipc.invoke("shortcut-unregister", key);

/**
 * 清空全部快捷键
 */
export const unShortcutAll = async (): Promise<void> =>
  await window.ipc.invoke("shortcut-unregisterAll");

/**
 * 获取已注册快捷键
 * @param key
 */
export const shortcutGet = async (key: string): Promise<Accelerator> =>
  await window.ipc.invoke("shortcut-get", key);

/**
 * 获取全部已注册快捷键
 */
export const shortcutGetAll = async (): Promise<Accelerator[]> =>
  await window.ipc.invoke("shortcut-getAll");

/**
 * 获取快捷键以文本展示
 * @param e
 * @returns String Ctrl + A
 */
export const getShortcutName = (e: KeyboardEvent) => {
  let arr = [];
  let hasPrimaryKey = false;
  if (e.altKey) arr.push("Alt");
  if (e.ctrlKey) arr.push("Ctrl");
  if (e.metaKey) arr.push("Cmd");
  if (e.shiftKey) arr.push("Shift");
  switch (true) {
    case e.code.startsWith("Digit"):
      arr.push(e.code.replace("Digit", ""));
      hasPrimaryKey = true;
      break;
    case e.code.startsWith("Key"):
      arr.push(e.code.replace("Key", ""));
      hasPrimaryKey = true;
      break;
    case e.code === "Backquote":
      arr.push("`");
      hasPrimaryKey = true;
      break;
    case e.code === "Escape":
      arr.push("Esc");
      hasPrimaryKey = true;
      break;
    case e.code === "BracketLeft":
      arr.push("[");
      hasPrimaryKey = true;
      break;
    case e.code === "BracketRight":
      arr.push("]");
      hasPrimaryKey = true;
      break;
    case e.code === "Comma":
      arr.push(",");
      hasPrimaryKey = true;
      break;
    case e.code === "Period":
      arr.push(".");
      hasPrimaryKey = true;
      break;
    case e.code === "Slash":
      arr.push("/");
      hasPrimaryKey = true;
      break;
    case e.code === "ArrowRight":
      arr.push("Right");
      hasPrimaryKey = true;
      break;
    case e.code === "ArrowLeft":
      arr.push("Left");
      hasPrimaryKey = true;
      break;
    case e.code === "ArrowUp":
      arr.push("Up");
      hasPrimaryKey = true;
      break;
    case e.code === "ArrowDown":
      arr.push("Down");
      hasPrimaryKey = true;
      break;
    case [
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
      "F11",
      "F12",
      "Space",
      "Backspace",
      "Enter",
    ].includes(e.code):
      arr.push(e.code);
      hasPrimaryKey = true;
      break;
  }
  if (arr.length <= 1 || !hasPrimaryKey) return "";
  return arr.join(" + ");
};
