const { join } = require("../dist/node/path");
const { appInstance } = require("../dist/main/app");
const { windowInstance } = require("../dist/main/window");
const { viewInstance } = require("../dist/main/view");
const { TrayInstance } = require("../dist/main/tray");
const { readFile } = require("../dist/main/file");
const { logError } = require("../dist/main/log");
const { app } = require("electron");
const { request } = require("../dist/main/net")
const net = require("../dist/main/net").default
appInstance
  .start()
  .then(async () => {

    net('https://baidu.com', { method: 'GET', headers: { 'content-Type': 'text/html;charset=UTF-8', mlmdflr: 'test' } }).then(res => {
      res.text().then(text => {
        console.log('baidu:', text.length);
      })
    }).catch(err => {
      console.log(err);
    })

    request('https://www.electronjs.org', { method: 'GET' }).then(res => {
      res.text().then(text => {
        console.log('electronjs:', text.length);
      })
    }).catch(err => {
      console.log(err);
    })


    //設置一些默認配置
    windowInstance.setDefaultCfg({
      defaultLoadUrl: join(__dirname, "../test/index.html"),
      defaultRoutePreload: join(__dirname, "../test/preload.js"),
      defaultUrlPreload: join(__dirname, "../test/preload.js"),
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
      viewInstance.bindBV(windowInstance.get(winid), viewInstance.getMap(`${await viewInstance.create(
        {
          url: 'https://baidu.com',
          session: {
            key: 'baidu',
            persistence: false
          }
        }
      )}`),
        //BrowserView大小和在窗体的位置
        { width: 800, height: 400, x: 0, y: 270 }
      )
    })

    // 托盤
    const dataUrl = 'data:image/png;base64,' + await readFile(join(__dirname, '../test/tray.png'), { encoding: 'base64' })
    TrayInstance.create(dataUrl);
    TrayInstance.main.on('click', () => windowInstance.func('show'))
  })
  .catch(app.isPackaged ? logError : console.error);
