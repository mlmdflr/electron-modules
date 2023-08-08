import { exec } from "node:child_process";

const rundll32exe = "rundll32.exe";
const dllPath = "%windir%\\system3\\shimgvw.dll";
const execParameter = ` ${rundll32exe} ${dllPath} `;

export const defaultOpen = (path: string) => exec(`"${path}" ${execParameter}`);