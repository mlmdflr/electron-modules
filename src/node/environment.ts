import { EOL, isWindows } from "./internal.constants.inside";

const platform = process.platform;

const systemVersion = process.getSystemVersion();

const isElectron = "electron" in process.versions;

const isUsingAsar =
  isElectron &&
  require.main &&
  require.main.filename &&
  require.main.filename.includes("app.asar");

export { EOL, platform, isWindows, isElectron, isUsingAsar, systemVersion };
