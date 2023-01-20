import { json } from "@remix-run/node";
import connect, { Knex } from "knex";
import pg from "pg";
import knexfile from "../knexfile";

pg.types.setTypeParser(20 /* int8 */, "text", (x) => {
  return Number(x);
});

function transformKeys(obj: any, method: (word: string) => string): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, method));

  if (obj instanceof Date) return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      method(key),
      transformKeys(value, method),
    ])
  );
}

const toCamelCase = (str: string = "") =>
  str.replace(/(?<!_)(_([^_]))/g, (_1, _2, r) => r.toUpperCase());

const toSnakeCase = (str: string = "") =>
  str.replace(/[a-z0-9]([A-Z])[A-Z]*/g, (str) => {
    const [a, b] = str.split("");
    return `${a}_${b.toLowerCase()}`;
  });

//@ts-expect-error
if (global.knex) {
  //@ts-expect-error
  global.knex.destroy();
  //@ts-expect-error
  global.knex = undefined;
}

const knex: Knex<any, unknown[]> = connect({
  ...(knexfile as any)[process.env.NODE_ENV || "development"],
  wrapIdentifier: (value: string) => toSnakeCase(value),
  postProcessResponse: (value: string) => transformKeys(value, toCamelCase),
});

//@ts-expect-error
global.knex = knex;

interface Serializable {
  toSQL: () => { sql: string; bindings: any[] };
}

type Primitive = string | boolean | number | null | Date;
type Interpolation =
  | Primitive
  | Primitive[]
  | Record<string, Primitive>
  | Buffer
  | Serializable
  | ((query: Knex.QueryBuilder) => void)
  | (() => Interpolation);

interface SqlPromise<T = any> extends Serializable {
  then: PromiseLike<T[]>["then"];
  maybeFirst: PromiseLike<T | undefined>["then"];
  first: PromiseLike<T>["then"];
  nest(): Serializable;
  nestFirst(): Serializable;
  paginate(page?: number, per?: number): SqlPromise<T>;
}

export class RowNotFoundError extends Error {}

function sqlTemplate(
  [first, ...strings]: TemplateStringsArray,
  ...args: Interpolation[]
): Serializable {
  let sql = first;
  let bindings: any[] = [];

  function parseArg(arg: Interpolation) {
    if (typeof arg === "function") {
      if (arg.length === 1) {
        const callback = arg as Knex.QueryCallback;
        const stmt = knex.queryBuilder();
        //@ts-expect-error
        stmt._method = "where";
        callback.call(stmt, stmt);
        let result = stmt.toSQL();
        sql += result.sql.slice(6);
        bindings.push(...result.bindings);
      } else {
        const thunk = arg as () => Interpolation;
        parseArg(thunk());
      }
    } else if (
      arg &&
      typeof arg === "object" &&
      "toSQL" in arg &&
      typeof arg.toSQL === "function"
    ) {
      const toSQL = arg.toSQL();
      sql += toSQL.sql;
      bindings.push(...toSQL.bindings);
    } else if (
      arg &&
      typeof arg === "object" &&
      Object.getPrototypeOf(arg) === Object.prototype
    ) {
      let obj = arg as Record<string, Primitive>;
      const whereIndex = sql.lastIndexOf("where");
      const insertIndex = sql.lastIndexOf("insert", whereIndex);
      const updateIndex = sql.lastIndexOf(
        "update",
        Math.max(insertIndex, whereIndex)
      );

      if (insertIndex > whereIndex && insertIndex > updateIndex) {
        // (key1, key2) values (value1, value2)
        sql += "(";
        sql += Object.keys(obj)
          .map(() => "??")
          .join(", ");
        bindings.push(...Object.keys(obj));
        sql += ") values (";
        sql += Object.keys(obj)
          .map(() => "?")
          .join(", ");
        bindings.push(...Object.values(obj));
        sql += ")";
      } else if (updateIndex > whereIndex && updateIndex > insertIndex) {
        // key1 = value1, key2 = value2
        sql += Object.entries(obj)
          .map(([k, v]) => {
            bindings.push(k, v);
            return "?? = ?";
          })
          .join(", ");
      } else {
        // key1 = value1 and key2 = value2
        sql += "(";
        sql += Object.entries(obj)
          .map(([k, v]) => {
            bindings.push(k);
            if (v !== null) bindings.push(v);
            return v === null ? "?? is null" : "?? = ?";
          })
          .join(" and ");
        sql += ")";
      }
    } else if (Array.isArray(arg)) {
      sql += arg.map(() => "?").join(",");
      bindings.push(...arg);
    } else {
      sql += "?";
      bindings.push(arg);
    }
  }

  for (let arg of args) {
    parseArg(arg);
    sql += strings.shift();
  }

  return {
    toSQL() {
      return { sql, bindings: Object.assign([], bindings) };
    },
  };
}

function toSqlPromise(stmt: Serializable, knex: Knex | Knex.Transaction) {
  let { sql, bindings } = stmt.toSQL();
  sql = sql.replace(/\s+/g, " ").trim();
  return {
    toSQL() {
      return { sql, bindings: Object.assign([], bindings) };
    },
    get then() {
      const promise = knex.raw(sql, bindings);
      const thenPromise = promise.then((r) => r.rows);
      return thenPromise.then.bind(thenPromise);
    },
    get maybeFirst() {
      const promise = toSqlPromise(
        {
          toSQL: () => ({
            sql: `with stmt as not materialized (${sql}) select * from stmt limit 1`,
            bindings,
          }),
        },
        knex
      );

      const thenPromise = promise.then(([row]) => {
        return row;
      });

      return thenPromise.then.bind(thenPromise);
    },
    get first() {
      const promise = toSqlPromise(
        {
          toSQL: () => ({
            sql: `with stmt as not materialized (${sql}) select * from stmt limit 1`,
            bindings,
          }),
        },
        knex
      );

      const thenPromise = promise.then(([row]) => {
        if (!row) throw json({ error: "Not Found" }, 404);
        return row;
      });

      return thenPromise.then.bind(thenPromise);
    },
    nest() {
      return {
        toSQL: () => ({
          sql: `coalesce((select jsonb_agg(subquery) from (${sql}) subquery), '[]'::jsonb)`,
          bindings,
        }),
      };
    },
    nestFirst() {
      return {
        toSQL: () => ({
          sql: `(select row_to_json(subquery) from (${sql}) subquery limit 1)`,
          bindings,
        }),
      };
    },
    paginate(page: number = 0, per: number = 250) {
      return toSqlPromise(
        {
          toSQL: () => ({
            sql: `with stmt as not materialized (${sql}) select * from stmt limit ? offset ?`,
            bindings: [...bindings, per, per * page],
          }),
        },
        knex
      );
    },
  };
}

export function sqlFrom(knex: Knex | Knex.Transaction) {
  return function sql<T>(
    strings: Parameters<typeof sqlTemplate>[0],
    ...args: Parameters<typeof sqlTemplate>[1][]
  ): SqlPromise<T> {
    return toSqlPromise(sqlTemplate(strings, ...args), knex);
  };
}

const sql = sqlFrom(knex);
export { knex, sql };
