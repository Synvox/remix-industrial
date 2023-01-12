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

  // Move new style tags to the head, then remove the script.
  // This seems to avoid hydration warnings
  const scriptTag =
    /**/ "<script>(()=>{" +
    /*  */ "let d=document,h=d.head,s=d.currentScript,p=s.parentElement;" +
    /*  */ "if(p!=h)" +
    /*    */ "h.appendChild(s.previousSibling);" +
    /*  */ "p.removeChild(s)" +
    /**/ "})()</script>";

  const transform = new Transform({
    transform(chunk, _, callback) {
      let result: string = chunk.toString();

      if (firstRun) {
        firstRun = false;
        const styleTag = sheet.getStyleTags();
        sheet.instance.clearTag();
        result = result.replace(replaceString, styleTag);
      } else if (sheet.instance.toString().length) {
        const styleTag = sheet.getStyleTags();
        sheet.instance.clearTag();
        result = styleTag + scriptTag + result;
      }

      callback(null, result);
    },
  });

  return { collectStyles, transform };
}
