const babel = require("@babel/core");
const babelPluginMacros = require("babel-plugin-macros");
const fs = require("node:fs");
const path = require("path");

function macrosPlugin() {
  const cache = new Map();
  return {
    name: "babel-plugin-macros",
    setup({ onLoad }) {
      const root = process.cwd();
      onLoad({ filter: /\.[tj]sx$/ }, async (args) => {
        let code = await fs.promises.readFile(args.path, "utf8");
        let key = args.path;
        let value = cache.get(key);

        if (!value || value.input !== code) {
          let plugins = ["jsx"];

          let loader = "jsx";

          if (args.path.endsWith(".tsx")) {
            plugins.push("typescript");
            loader = "tsx";
          }

          const result = await babel.transformAsync(code, {
            babelrc: false,
            configFile: false,
            ast: false,
            root,
            filename: args.path,
            parserOpts: {
              sourceType: "module",
              allowAwaitOutsideFunction: true,
              plugins,
            },
            plugins: [babelPluginMacros],
            sourceMaps: true,
            inputSourceMap: false,
          });

          value = {
            input: code,
            output: {
              contents:
                result.code +
                `//# sourceMappingURL=data:application/json;base64,` +
                Buffer.from(JSON.stringify(result.map)).toString("base64"),
              loader,
              resolveDir: path.dirname(args.path),
            },
          };

          cache.set(key, value);
        }

        return value.output;
      });
    },
  };
}

module.exports = { macrosPlugin };
