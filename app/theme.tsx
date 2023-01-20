export const theme = {};

export type Theme = typeof theme;

declare module "styled-components/macro" {
  export interface DefaultTheme extends Theme {}
}
