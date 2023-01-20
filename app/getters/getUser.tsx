import { sql } from "~/knex.server";
import { User } from "~/tables";
import { createGetter } from "./createGetter";
import { getToken } from "./getToken";

export const getUser = createGetter(async (args) => {
  const token = await getToken(args);

  const user = await sql<User>`
    select users.*
    from users
    where ${{ id: token.userId }}
    limit 1
  `.first();

  return user;
});
