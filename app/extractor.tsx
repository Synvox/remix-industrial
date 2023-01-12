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
    /*    */ 'while(let e=s.previousSibling,e.matches("[data-styled]"))' +
    /*      */ "h.appendChild(e);" +
    /*  */ "p.removeChild(s);" +
    /**/ "})()</script>";

  const transform = new Transform({
    transform(chunk, _, callback) {
      let result: string = chunk.toString();

      if (firstRun) {
        firstRun = false;
        const styleTags = sheet.getStyleTags();
        sheet.instance.clearTag();
        result = result.replace(replaceString, styleTags);
      } else if (sheet.instance.toString().length) {
        const closingTagRegex = /((<\/)\w+(>))/i;
        const match = result.match(closingTagRegex);

        if (match && match.index !== undefined) {
          const endIndex = match.index + match[0].length;

          const styleTag = sheet.getStyleTags();
          sheet.instance.clearTag();

          // Splice the new html into this chunk after a closing tag.
          // Closing tags seem to work better than opening tags because
          //   1. They have no attributes
          //   2. You don't risk putting a tag as children of a special tag
          //      like script, style, textarea, etc.
          // There is still a risk of inserting into a script tag if the
          // script tag includes a closing tag as a string. Splitting the
          // tag like '</' + 'div>' may be the easiest solution.
          result =
            result.slice(0, endIndex) +
            styleTag +
            scriptTag +
            result.slice(endIndex);
        }
      }

      callback(null, result);
    },
    flush(callback) {
      if (!sheet.instance.toString().length) return callback(null, "");
      const styleTag = sheet.getStyleTags();
      callback(null, styleTag + scriptTag);
    },
  });

  return { collectStyles, transform };
}
