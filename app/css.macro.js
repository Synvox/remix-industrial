//@ts-check
const fs = require("fs");
const { relative, resolve, parse } = require("path");
const { createMacro } = require("babel-plugin-macros");

/** @type {<T extends string>(str: TemplateStringsArray, ..._args: never[]) => Record<T, string>} */
const css = createMacro(function ({ references, babel, state }) {
  if (!state.filename) throw new Error("state.filename is undefined.");

  /** @type {string[]} */
  const styles = [];

  references.default.forEach((referencePath) => {
    if (babel.types.isTaggedTemplateExpression(referencePath.parent)) {
      //@ts-expect-error
      const quasiPath = referencePath.parentPath.get("quasi");
      //@ts-expect-error
      const valueString = quasiPath.parentPath.get("quasi").evaluate().value;
      styles.push(valueString);
      const valueNode = babel.types.identifier("__css__");
      //@ts-expect-error
      quasiPath.parentPath.replaceWith(valueNode);
    }
  });

  if (styles.length === 0) return;

  const fileExt = ".module.css";
  const { dir, name } = parse(state.filename);
  const newDirectory = resolve(__dirname, "../css", relative(__dirname, dir));
  const filePath = newDirectory + "/" + name + fileExt;

  const cssImport = babel.template(
    `import __css__ from ${JSON.stringify(filePath)};`,
    {
      sourceType: "module",
    }
  );

  state.file.ast.program.body.unshift(
    //@ts-expect-error
    cssImport()
  );

  fs.mkdirSync(newDirectory, { recursive: true });
  fs.writeFileSync(
    filePath,
    styles
      .map((x) => x.trim())
      .join("\n")
      .replace(/^ {2}/gm, "")
  );
});

module.exports = css;
