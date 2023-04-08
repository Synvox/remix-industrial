import css from "../css.macro";

export default function () {
  return <div className={classes.class}>hi</div>;
}

const classes = css<"class">`
  .class {
    color: red;
  }
`;
