import { ReactNode } from "react";
import ReplaceStream from "replacestream";
import { Stream } from "stream";
import { ServerStyleSheet } from "styled-components";

export function getExtractor() {
  const replaceString = "__STYLES__";

  const sheet = new ServerStyleSheet();

  function collectStyles(node: ReactNode) {
    return sheet.collectStyles(node);
  }

  function addStyles(markup: string): string;
  function addStyles(markup: Stream): Stream;
  function addStyles(markup: string | Stream): string | Stream {
    const styleTags = sheet.getStyleTags();

    if (typeof markup === "string")
      return markup.replace(replaceString, styleTags);
    else return markup.pipe(ReplaceStream(replaceString, styleTags));
  }

  return { collectStyles, addStyles };
}
