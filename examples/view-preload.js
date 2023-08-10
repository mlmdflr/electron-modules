const { contextBridge, ipcRenderer } = require("electron");
const { urlPreloadInit } = require("../dist/preload");

ipcRenderer.on("load-url", (_, args) => {
  // 挂载至window
  contextBridge.exposeInMainWorld("customize", args);
  document.body.setAttribute("platform", process.platform);
});
urlPreloadInit({ sandbox: false });
