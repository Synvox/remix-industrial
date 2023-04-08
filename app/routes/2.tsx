import css from "../css.macro";

export default function () {
  return <div className={classes.red}>Composed red</div>;
}

const classes = css<"red">`
  .red {
    composes: class from "./index.module.css";
  }
`;
