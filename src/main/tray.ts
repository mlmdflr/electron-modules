import { app, Menu, Tray as electronTray, nativeImage } from "electron";
import { windowInstance } from "./window";
class Tray {
  private static instance: Tray;

  public main: electronTray | undefined;

  constructor() {}

  static getInstance() {
    if (!Tray.instance) Tray.instance = new Tray();
    return Tray.instance;
  }

  /**
   * *Multiple creation will overwrite
   * @param trayImgPath
   * @param toolTip
   * @param temp
   */
  create = (
    trayImgPath: string,
    toolTip: string = app.name,
    temp?: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[]
  ) => {
    this.main && this.main.destroy();
    let contextMenu = Menu.buildFromTemplate([
      {
        label: "显示",
        click: () => windowInstance.func("show"),
      },
      {
        label: "退出",
        click: () => app.quit(),
      },
    ]);
    temp && (contextMenu = Menu.buildFromTemplate(temp));
    this.main = new electronTray(nativeImage.createFromDataURL(trayImgPath));
    this.main.setContextMenu(contextMenu);
    this.main.setToolTip(toolTip);
  };
  /**
   * *throw error `Tray not created` or `Tray not destroyed`
   * @param temp
   * @param toolTip
   * @param trayImgPath
   */
  changeFrom = (
    temp: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[],
    toolTip?: string,
    trayImgPath?: string
  ) => {
    !this.main &&
      (() => {
        throw new Error(`Tray not created`);
      })();
    this.main.isDestroyed() &&
      (() => {
        throw new Error(`Tray is destroyed`);
      })();
    this.main?.setContextMenu(Menu.buildFromTemplate(temp));
    toolTip && this.main?.setToolTip(toolTip);
    trayImgPath &&
      this.main?.setImage(nativeImage.createFromDataURL(trayImgPath));
  };
}

export const TrayInstance = Tray.getInstance();
