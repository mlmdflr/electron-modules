import { execSync } from "node:child_process";
// darwin
const DarwinParameter = "ioreg -rd1 -c IOPlatformExpertDevice";
export const getMachineGuidDarwin = () => {
  try {
    return execSync(DarwinParameter)
      .toString()
      .split("IOPlatformUUID")[1]
      .split("\n")[0]
      .replace(/\=|\s+|\"/gi, "")
      .toLowerCase();
  } catch (error) {
    throw error;
  }
};
