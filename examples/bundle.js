(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bundle = factory());
})(this, (function () { 'use strict';

  var renderer = {};

  var fetch$2 = {};

  function e(e){let t=[];for(let a in e){let n=e[a];["",void 0,null].includes(n)||(n.constructor===Array?n.forEach((e=>{t.push(encodeURIComponent(a)+"[]="+encodeURIComponent(e));})):t.push(encodeURIComponent(a)+"="+encodeURIComponent(n)));}return t.length?t.join("&"):""}function t(e){const t=new AbortController,a=setTimeout((()=>{t.abort();}),e);return {signal:t.signal,id:a}}async function a(a,n,r={}){let s=null;r.signal||(s=t(r.timeout||3e3));let i={isHeaders:r.isHeaders,isStringify:r.isStringify,headers:new Headers(Object.assign({"content-type":"application/json;charset=utf-8"},r.headers)),type:r.type||"TEXT",method:r.method||"GET",signal:s?s.signal:r.signal};return r.data&&("GET"===i.method?n=`${n}?${e(r.data)}`:i.body=i.isStringify?e(r.data):JSON.stringify(r.data)),async function(e,t,a){return e(t,a).then((e=>{if(e.status>=200&&e.status<300)return e;throw new Error(e.statusText)})).then((async e=>{switch(a.type){case"TEXT":return a.isHeaders?{headers:e.headers,data:await e.text()}:await e.text();case"JSON":return a.isHeaders?{headers:e.headers,data:await e.json()}:await e.json();case"BUFFER":return a.isHeaders?{headers:e.headers,data:await e.arrayBuffer()}:await e.arrayBuffer();case"BLOB":return a.isHeaders?{headers:e.headers,data:await e.blob()}:await e.blob()}}))}(a,n,i).then((e=>(s&&clearTimeout(s.id),e)))}fetch$2.request=(e,t={})=>a(fetch,e,t);

  var base = {};

  base.LoadRoute=o=>window.ipc.on("load-route",o),base.customizeUpdate=()=>{"session"in window.customize?window.ipc.send("view-update",window.customize):window.ipc.send("window-update",window.customize);},base.windowSetBackgroundColor=(o=window.customize.id,i)=>{"session"in window.customize?"number"==typeof o&&window.ipc.send("view-bg-color-set",{id:o,color:i}):window.ipc.send("window-bg-color-set",{id:o,color:i});};

  var window$1 = {};

  window$1.windowAlwaysOnTop=(i=window.customize.id,w,o)=>window.ipc.send("window-always-top-set",{id:i,is:w,type:o}),window$1.windowBlurFocusOn=i=>window.ipc.on("window-blur-focus",i),window$1.windowBlurFocusRemove=()=>window.ipc.removeAllListeners("window-blur-focus"),window$1.windowClose=(i=window.customize.id)=>window.ipc.send("window-close",i),window$1.windowCreate=(i,w)=>window.ipc.invoke("window-new",{customize:i,opt:w}),window$1.windowFunc=(i,w,o=window.customize.id)=>window.ipc.send("window-func",{type:i,data:w,id:o}),window$1.windowHide=(i=window.customize.id)=>window.ipc.send("window-func",{type:"hide",id:i}),window$1.windowHookMessageOn=(i,w)=>window.ipc.on(`window-hook-message-${w}`,i),window$1.windowIdRoute=i=>window.ipc.invoke("window-id-route",i),window$1.windowMax=(i=window.customize.id)=>window.ipc.send("window-func",{type:"maximize",id:i}),window$1.windowMaxMin=(i=window.customize.id)=>window.ipc.send("window-max-min-size",i),window$1.windowMaximizeOn=i=>window.ipc.on("window-maximize-status",i),window$1.windowMaximizeRemove=()=>window.ipc.removeAllListeners("window-maximize-status"),window$1.windowMessageOn=(i,w="default")=>window.ipc.on(`window-message-${w}-back`,i),window$1.windowMessageRemove=(i="default")=>window.ipc.removeAllListeners(`window-message-${i}-back`),window$1.windowMessageSend=(i,w=[],o="default",e=!1)=>{"parentId"in window.customize&&0===w.length&&"number"==typeof window.customize.parentId&&(w=[window.customize.parentId]),window.ipc.send("window-message-send",{channel:o,value:i,isback:e,acceptIds:w,id:window.customize.id});},window$1.windowMin=(i=window.customize.id)=>window.ipc.send("window-func",{type:"minimize",id:i}),window$1.windowSetMaxMinSize=(i,w,o=window.customize.id)=>window.ipc.send(`window-${i}-size-set`,{id:o,size:w}),window$1.windowSetSize=(i,w=!0,o=!1,e=window.customize.id)=>window.ipc.send("window-size-set",{id:e,size:i,resizable:w,center:o}),window$1.windowShow=(i=window.customize.id,w=0)=>setTimeout((()=>window.ipc.send("window-func",{type:"show",id:i})),w),window$1.windowStatus=(i=window.customize.id,w)=>window.ipc.invoke("window-status",{type:w,id:i}),window$1.windowViewIdAll=(i=window.customize.id)=>window.ipc.invoke("windows-view-id-all",{id:i});

  const { request: fetch$1 } = fetch$2;
  const { LoadRoute } = base;
  const { windowShow, windowClose } = window$1;

  fetch$1("https://baidu.com").then(console.log).catch(console.error);

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

  return renderer;

}));
