const { readdirSync, statSync } = require("fs")
const { resolve, extname } = require("path")
const { builtinModules } = require("module")
const terser = require("@rollup/plugin-terser")
const commonjs = require("@rollup/plugin-commonjs")
const nodeResolve = require("@rollup/plugin-node-resolve")
const json = require("@rollup/plugin-json")
const typescript = require("rollup-plugin-typescript2")

const plugins = () => [
  json(),
  commonjs(),
  typescript({
    tsconfig: "./tsconfig.json",
    useTsconfigDeclarationDir: true,
    preferBuiltins: true,
    browser: false,
    extensions: ['.mjs', '.ts', '.js', '.json', '.node']
  }),
  nodeResolve({
    preferBuiltins: true,
  }),
  terser()
];

const external = [
  ...builtinModules,
  "./file",
  "./global",
  "./session",
  "./shortcut",
  "./tray",
  "./log",
  "./update",
  "./utils",
  './machine',
  "./window",
  "./view",
  "../main.darwin/machine",
  "../main.linux/machine",
  "../main.win32/machine",
  "../node/path",
  "../node/environment",
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
  //skip inside
  if (path.endsWith('.inside')) return;
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

exports.default = config