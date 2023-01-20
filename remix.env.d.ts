/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import { CSSProp } from "styled-components";
import { RuleSet } from "styled-components/dist/types";

declare module "react" {
  interface Attributes {
    css?: CSSProp | RuleSet<object>;
  }
}
