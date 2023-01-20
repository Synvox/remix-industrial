import { Knex } from "knex";

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};

export type UserToken = {
  id: string;
  userId: number;
  issuedAt: string;
  revokedAt: string | null;
};

type MaybeRaw<T> = { [K in keyof T]: T[K] | Knex.Raw };
type TableHelper<T> = Knex.CompositeTableType<
  T,
  MaybeRaw<Partial<T>>,
  MaybeRaw<Partial<T>>
>;

declare module "knex/types/tables" {
  interface Tables {
    users: TableHelper<User>;
    userTokens: TableHelper<UserToken>;
  }
}
