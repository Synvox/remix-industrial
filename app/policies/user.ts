import { DataFunctionArgs } from "@remix-run/node";
import { Knex } from "knex";
import { getUser } from "~/getters/getUser";

export async function userPolicy(
  ctx: DataFunctionArgs,
  userIdColumnName = "id"
) {
  const user = await getUser(ctx);
  return (q: Knex.QueryBuilder) => {
    q.where(userIdColumnName, user.id);
  };
}
