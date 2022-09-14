import { execSync } from "node:child_process";

// win
const WinRegBinPath =
  process.arch === "ia32" &&
  process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")
    ? "%windir%\\sysnative\\cmd.exe /c %windir%\\System32"
    : "%windir%\\System32";
const WinParameter =
  `${WinRegBinPath}\\REG.exe ` +
  "QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography " +
  "/v MachineGuid";
export const getMachineGuidWin = () => {
  try {
    return execSync(WinParameter)
      .toString()
      .split("REG_SZ")[1]
      .replace(/\r+|\n+|\s+/gi, "")
      .toLowerCase();
  } catch (error) {
    throw error;
  }
};
