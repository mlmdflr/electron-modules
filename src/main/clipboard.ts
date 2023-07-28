import { clipboard, ipcMain } from "electron";

export const clipboardOn = () => {
  ipcMain.handle("app-clipboard-read-text", async (_, args) =>
    clipboard.readText(args.type),
  );
  ipcMain.handle("app-clipboard-write-text", async (_, args) =>
    clipboard.writeText(args.text, args.type),
  );
};
