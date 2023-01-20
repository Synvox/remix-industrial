import "styled-components/macro";
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ensureLoggedIn } from "~/getters/getToken";
import { useUser } from "~/hooks/useUser";
import { Stack } from "~/components/Stack";

export async function loader(ctx: LoaderArgs) {
  await ensureLoggedIn(ctx);

  return json({
    ok: true,
  });
}

export default function () {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <Stack
      space="medium"
      padding="medium"
      margin="medium"
      direction="row"
      small={{ align: "center", direction: "column", space: "small" }}
      css={`
        border-radius: 3px;
        border: 1px solid #ccc;
      `}
    >
      <div
        css={`
          border-radius: 1000px;
          width: 40px;
          height: 40px;
          background: #ccc;
        `}
      />
      <Stack space="xsmall" small={{ align: "center" }}>
        <div>{user.firstName}</div>
        <div
          css={`
            font-size: 14px;
          `}
        >
          Yo
        </div>
      </Stack>
    </Stack>
  );
}
