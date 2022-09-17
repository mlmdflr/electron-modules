const { join } = require("../dist/node/path");
const { appInstance } = require("../dist/main/app");
const { windowInstance } = require("../dist/main/window");
const { viewInstance } = require("../dist/main/view");
const { TrayInstance } = require("../dist/main/tray");
const { readFile } = require("../dist/main/file");
const { logError } = require("../dist/main/log");
const { app, ipcMain } = require("electron");
const { request } = require("../dist/main/net")
const net = require("../dist/main/net").default
const { Session } = require("../dist/main/session")
appInstance.isDisableHardwareAcceleration = true
appInstance
  .start()
  .then(async () => {
    console.log(process.versions.electron);
    //使用单独会话发送请求示例
    const baiduSess = new Session(`persist:baidu`)
    baiduSess.urlHeaders = {
      "https://baidu.com": {
        "testToken": 'baidu'
      }
    }
    baiduSess.on()
    const electronSess = new Session(`persist:electron`)
    electronSess.urlHeaders = {
      "https://www.electronjs.org": {
        "testToken": 'electron'
      }
    }
    electronSess.on()
    net('https://baidu.com', { session: baiduSess.session, method: 'GET', headers: { 'content-Type': 'text/html;charset=UTF-8', mlmdflr: 'test' } }).then(res => {
      res.text().then(text => {
        console.log('baidu response text:', text.length);
      })
    }).catch(err => {
      console.log(err);
    })
    request('https://www.electronjs.org', { session: electronSess.session, method: 'GET' }).then(res => {
      res.text().then(text => {
        console.log('electronjs response text:', text.length);
      })
    }).catch(err => {
      console.log(err);
    })


    //設置一些默認配置
    windowInstance.setDefaultCfg({
      defaultLoadUrl: join(__dirname, "../test/index.html"),
      defaultRoutePreload: join(__dirname, "../test/preload.js"),
      defaultUrlPreload: join(__dirname, "../test/url-preload.js"),
    })

    //创建窗体
    windowInstance.create(
      {
        title: "electron-template",
        route: "/",
        viewType: 'Multiple',
        isMainWin: true,
      },
      {
        width: 800,
        height: 650,
        frame: true,
        show: false,
        resizable: false
      }
    ).then(async winid => {
      //创建一个BrowserView并绑定上窗体
      viewInstance.createBindBV(winid,
        {
          url: 'https://baidu.com',
          session: {
            key: 'baidu',
            persistence: true
          }
        },
        { sandbox: false, preload: join(__dirname, "../test/view-preload.js") },
        { width: 800, height: 400, x: 0, y: 270 }
      )
    })

    //模态框
    ipcMain.on('new-model-window', (_, id) => {
      windowInstance.create(
        {
          route: '/',
          parentId: id,
          isOpenMultiWindow: true
        },
        {
          show: true,
          modal: true,
          width: 400,
          height: 325
        }
      )
    })


    // 托盤
    const dataUrl = 'data:image/png;base64,' + await readFile(join(__dirname, '../test/tray.png'), { encoding: 'base64' })
    TrayInstance.create(dataUrl);
    TrayInstance.main.on('click', () => windowInstance.func('show'))
  })
  .catch(app.isPackaged ? logError : console.error);
