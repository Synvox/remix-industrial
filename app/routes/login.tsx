import { json, LoaderArgs, redirect } from "@remix-run/node";
import { getFormData } from "~/getters/getFormData";
import { ensureLoggedOut, newSessionCookie } from "~/getters/getToken";
import { sql } from "~/knex.server";
import { User } from "~/tables";

export async function loader(args: LoaderArgs) {
  await ensureLoggedOut(args);

  return null;
}

export async function action(args: LoaderArgs) {
  await ensureLoggedOut(args);

  const { email = "" } = await getFormData<"email">(args);
  const user = await sql<User>`
    select *
    from users
    where email = ${email}
  `.maybeFirst();

  if (!user) {
    throw json(
      {
        errors: { email: "not found" },
      },
      { status: 404 }
    );
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await newSessionCookie(user.id),
    },
  });
}

export default function Index() {
  return (
    <form method="post">
      <input name="email" />
      <button>Submit</button>
    </form>
  );
}
