const { request: fetch } = require("../dist/renderer/fetch.js");
const { LoadRoute } = require("../dist/renderer/base.js");
const { windowShow, windowClose } = require("../dist/renderer/window.js");

fetch("https://baidu.com").then(console.log).catch(console.error);

BigInt.prototype.toJSON = function () {
  return this.toString();
};

LoadRoute((_, args) => {
  window.customize = args;
  document.body.innerHTML += `<div style="-webkit-app-region: drag;">
    <h1>hello electron</h1>
    <div>environment: <br/>${JSON.stringify(window.environment)}</div>
    <br/>
    <div>customize: <br/>${JSON.stringify(window.customize)}</div>
    <button id="windowClose" style="-webkit-app-region: no-drag;" >关闭</button>
    <button style="-webkit-app-region: no-drag;" onclick="window.ipc.send('new-model-window',${
      window.customize.id
    }n)">模态框</button>
    <button style="-webkit-app-region: no-drag;" onclick="window.open('https://github.com/mlmdflr')">window.open</button>
    The following is BrowserView
    </div> `;
  windowShow();
  document.getElementById("windowClose").onclick = () => windowClose();
});
