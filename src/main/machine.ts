import { getMachineGuidDarwin } from "../main.darwin/machine";
import { getMachineGuidLinux } from "../main.linux/machine";
import { getMachineGuidWin } from "../main.win32/machine";

export const getMachineGuid = () => {
  return process.platform === "win32"
    ? getMachineGuidWin()
    : process.platform === "linux"
    ? getMachineGuidLinux()
    : process.platform === "darwin"
    ? getMachineGuidDarwin()
    : "none";
};
