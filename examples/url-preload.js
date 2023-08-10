const { contextBridge, ipcRenderer } = require("electron");

ipcRenderer.on("load-url", (_, args) => {
  // 挂载至window
  contextBridge.exposeInMainWorld("customize", args);
  document.body.setAttribute("platform", process.platform);
  setTimeout(
    () =>
      ipcRenderer.send("window-func", {
        type: "show",
        id: args.id,
      }),
    200,
  );
});

contextBridge.exposeInMainWorld("ipc", {
  send: (channel, args) => ipcRenderer.send(channel, args),
  sendSync: (channel, args) => ipcRenderer.sendSync(channel, args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  once: (channel, listener) => ipcRenderer.once(channel, listener),
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

contextBridge.exposeInMainWorld("environment", {
  systemVersion: process.getSystemVersion(),
  platform: process.platform,
});
