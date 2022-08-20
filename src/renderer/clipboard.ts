import type { ClipboardType } from "../types";

/**
 * 返回 string - 剪贴板中的内容为纯文本。
 * @param type
 */
export const clipboardReadText = (type?: ClipboardType): Promise<string> =>
  window.ipc.invoke("app-clipboard-read-text", { type });

/**
 * 将 text 作为纯文本写入剪贴板。
 * @param text
 */
export const clipboardWriteText = (
  text: string,
  type?: ClipboardType
): Promise<void> =>
  window.ipc.invoke("app-clipboard-write-text", { text, type });
