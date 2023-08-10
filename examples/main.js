const { join } = require("../dist/node/path");
const { appInstance } = require("../dist/main/app");
const { windowInstance } = require("../dist/main/window");
const { viewInstance } = require("../dist/main/view");
const { TrayInstance } = require("../dist/main/tray");
const { readFile } = require("../dist/main/file");
const { logError } = require("../dist/main/log");
const { app, ipcMain } = require("electron");
const { request } = require("../dist/main/net");
const { request: fetch } = require("../dist/main/fetch");
const { Session } = require("../dist/main/session");

appInstance.isDisableHardwareAcceleration = true;
appInstance
  .start()
  .then(async () => {
    console.log(process.versions.electron);
    //使用单独会话发送请求示例
    const baiduSess = new Session(`persist:baidu`);
    baiduSess.urlHeaders = {
      "https://baidu.com": {
        testToken: "baidu",
      },
    };
    baiduSess.on();
    const electronSess = new Session(`persist:electron`);
    electronSess.urlHeaders = {
      "https://www.electronjs.org": {
        testToken: "electron",
      },
    };
    electronSess.on();
    //两个内置请求方法示例 net底层使用electron的net发起请求
    //主线程的fetch则是由session下的实例方法fetch
    request("https://baidu.com", {
      session: baiduSess.session,
      method: "GET",
      headers: { "content-Type": "text/html;charset=UTF-8", mlmdflr: "test" },
    })
      .then((res) => {
        res.text().then((text) => {
          console.log("net baidu response text:", text.length);
        });
      })
      .catch((err) => {
        console.log(err);
      });
    fetch("https://baidu.com", {
      session: baiduSess.session,
      method: "GET",
      headers: { "content-Type": "text/html;charset=UTF-8", mlmdflr: "test" },
    })
      .then((text) => {
        console.log("fetch baidu response text:", text.length);
      })
      .catch((err) => {
        console.log(err);
      });

    request("https://www.electronjs.org", {
      session: electronSess.session,
      method: "GET",
    })
      .then((res) => {
        res.text().then((text) => {
          console.log("net electronjs response text:", text.length);
        });
      })
      .catch((err) => {
        console.log(err);
      });
    fetch("https://www.electronjs.org", {
      session: electronSess.session,
      method: "GET",
      headers: { "content-Type": "text/html;charset=UTF-8", mlmdflr: "test" },
    })
      .then((text) => {
        console.log("fetch electronjs response text:", text.length);
      })
      .catch((err) => {
        console.log(err);
      });

    //設置一些默認配置
    windowInstance.setDefaultCfg({
      defaultLoadUrl: join(__dirname, "../examples/index.html"),
      defaultRoutePreload: join(__dirname, "../examples/preload.js"),
      defaultUrlPreload: join(__dirname, "../examples/url-preload.js"),
    });

    //创建窗体
    let winid = windowInstance.create(
      {
        title: "electron-template",
        route: "/",
        viewType: "Multiple",
        isMainWin: true,
      },
      {
        width: 800,
        height: 650,
        frame: true,
        show: false,
        resizable: false,
      },
    );

    // 创建一个BrowserView并绑定上窗体
    viewInstance.createBindBV(
      winid,
      {
        url: "https://baidu.com",
        session: {
          key: "baidu",
          persistence: true,
        },
      },
      {
        sandbox: false,
        preload: join(__dirname, "../examples/view-preload.js"),
      },
      { width: 800, height: 400, x: 0, y: 270 },
    );

    //模态框
    ipcMain.on("new-model-window", (_, id) => {
      const win = windowInstance.get(id);
      windowInstance.create(
        {
          route: "/",
          parentId: id,
          isOpenMultiWindow: true,
        },
        {
          show: true,
          modal: true,
          width: win ? win.getSize()[0] * 0.8 : undefined,
          height: win ? win.getSize()[1] * 0.8 : undefined,
        },
      );
    });

    // 托盤
    const dataUrl =
      "data:image/png;base64," +
      (await readFile(join(__dirname, "../examples/tray.png"), {
        encoding: "base64",
      }));
    TrayInstance.create(dataUrl);
    TrayInstance.main.on("click", () => windowInstance.func("show"));
  })
  .catch(app.isPackaged ? logError : console.error);
