import css from "../css.macro";

export default function () {
  return <div className={classes.red}>Composed red</div>;
}

const classes = css<"red">`
  @value class from "./index.module.css";

  .class.red {
    color: blue;
  }
`;
