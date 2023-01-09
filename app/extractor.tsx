import { ReactNode } from "react";
import { Transform } from "stream";
import { ServerStyleSheet } from "styled-components";

export function getExtractor() {
  const replaceString = "__STYLES__";

  const sheet = new ServerStyleSheet();

  function collectStyles(node: ReactNode) {
    return sheet.collectStyles(node);
  }

  let firstRun = true;

  const transform = new Transform({
    transform(chunk, _, callback) {
      if (firstRun) {
        firstRun = false;
        const html = sheet.getStyleTags();
        sheet.instance.clearTag();
        callback(null, chunk.toString().replace(replaceString, html));
      } else {
        const closingTagRegex = /((<\/)\w+(>))/i;
        const renderedHtml: string = chunk.toString();
        const match = renderedHtml.match(closingTagRegex);
        if (match && sheet.instance.toString().length) {
          const scriptTag = `${sheet.getStyleTags()}<script>(()=>{let d=document,s=d.currentScript;d.head.appendChild(s.previousSibling);s.parentElement.removeChild(s);})();</script>`;
          sheet.instance.clearTag();
          const endIndex = match.index! + match[0].length;

          callback(
            null,
            renderedHtml.slice(0, endIndex) +
              scriptTag +
              renderedHtml.slice(endIndex)
          );
        } else callback(null, chunk);
      }
    },
  });

  return { collectStyles, transform };
}
