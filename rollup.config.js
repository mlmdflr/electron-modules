import { readdirSync, statSync } from "fs";
import { resolve, extname } from "path";
import { builtinModules } from "module";
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";

const plugins = () => [
  json(),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
    preferBuiltins: true,
    browser: false,
    extensions: ['.mjs', '.ts', '.js', '.json', '.node']
  }),
  nodeResolve({
    preferBuiltins: true,
  }),
  terser(),
];

const external = [
  ...builtinModules,
  "./file",
  "./global",
  "./log",
  "./path",
  "./session",
  "./shortcut",
  "./tray",
  "./update",
  "./utils",
  './machine',
  "./window",
  "./view",
  "../main.darwin/machine",
  "../main.linux/machine",
  "../main.win32/machine",
  "../node/path",
  "../node/internal.constants",
  "./global.primordials",
  "./internal.validators",
  "./internal.constants",
  "./internal.errors",
  "./internal.util",
  "electron",
  "electron-updater",
  "builder-util-runtime",
];

/** @type {import('rollup').RollupOptions[]} */
let srcPath = resolve("src");

let dPathLength = (resolve() + "/").length;

function file(path) {
  let files = [];
  let dirArray = readdirSync(path);
  for (let d of dirArray) {
    let filePath = resolve(path, d);
    let stat = statSync(filePath);
    if (stat.isDirectory()) {
      files = files.concat(file(filePath));
    }
    if (stat.isFile() && extname(filePath) === ".ts") {
      files.push(filePath);
    }
  }
  return files;
}

const flies = file(srcPath).map((e) =>
  e.substring(dPathLength + 4, e.length - 3)
);
let config = [];
flies.forEach((path) => {
  if (path.startsWith("types")) return;
  if (path.startsWith("renderer")) {
    config.push({
      input: `./src/${path}.ts`,
      output: [
        {
          file: `./dist/${path}.js`,
          exports: "auto",
          format: "commonjs",
          sourcemap: false,
        },
        {
          file: `./dist/${path}.mjs`,
          format: "esm",
          sourcemap: false,
        },
      ],
      external,
      plugins: plugins(),
    });
    return;
  }
  config.push({
    input: `./src/${path}.ts`,
    output: [
      {
        file: `./dist/${path}.js`,
        exports: "auto",
        format: "commonjs",
        sourcemap: false,
      }
    ],
    external,
    plugins: plugins(),
  });
});


export default config;