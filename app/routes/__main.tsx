import { json, LoaderArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { normalize } from "polished";
import { createGlobalStyle } from "styled-components/macro";
import { ensureLoggedIn } from "~/getters/getToken";
import { getUser } from "~/getters/getUser";
import { UserProvider } from "~/hooks/useUser";

export async function loader(args: LoaderArgs) {
  await ensureLoggedIn(args);
  return json({ user: await getUser(args) });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <GlobalStyle />
      <UserProvider user={user}>
        <Outlet />
      </UserProvider>
    </>
  );
}

const GlobalStyle = createGlobalStyle`
  ${normalize()}
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;
