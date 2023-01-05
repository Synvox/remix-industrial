const { withEsbuildOverride } = require("remix-esbuild-override");
const { macrosPlugin } = require("./plugins/macros");

withEsbuildOverride((option) => {
  option.plugins = [macrosPlugin(), ...option.plugins];

  return option;
});

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
};
