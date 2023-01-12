import { defer } from "@remix-run/node";
import { Await, Link, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";
import styled from "styled-components/macro";

async function getUser() {
  await new Promise((r) => setTimeout(r, 1000));
  return { id: 123 };
}

export function loader() {
  return defer({
    user: getUser(),
  });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <Something>
      First <Link to="/2">forward</Link>
      <Suspense fallback={<Loader>Loading...</Loader>}>
        <Await
          resolve={user}
          children={(user) => <Container>{user.id}</Container>}
        />
      </Suspense>
    </Something>
  );
}

const Something = styled.div`
  padding: 10px;
`;

const Loader = styled.div`
  color: red;
`;

const Container = styled.div`
  background-color: blue;
  color: white;
  &:hover {
    background-color: green;
  }
`;
