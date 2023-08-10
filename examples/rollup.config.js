const nodeResolve = require("@rollup/plugin-node-resolve");
const json = require("@rollup/plugin-json");
const commonjs = require("@rollup/plugin-commonjs");

const plugins = () => [
  json(),
  commonjs(),
  nodeResolve({
    preferBuiltins: true,
  }),
];

exports.default = {
  input: "examples/renderer.js",
  output: {
    name: "bundle",
    file: "examples/bundle.js",
    format: "umd",
  },
  plugins: plugins(),
};
