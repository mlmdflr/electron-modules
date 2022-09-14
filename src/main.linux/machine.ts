import { execSync } from "node:child_process";
const LinuxParameter =
  "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :";
export const getMachineGuidLinux = () => {
  try {
    return execSync(LinuxParameter)
      .toString()
      .replace(/\r+|\n+|\s+/gi, "")
      .toLowerCase();
  } catch (error) {
    throw error;
  }
};
