import { Link } from "@remix-run/react";
import { Suspense } from "react";
import styled from "styled-components/macro";

function newGetter<T>(fn: () => Promise<T>): () => T {
  let promise: Promise<T> | null = null;
  let value: T | undefined = undefined;
  return function (): T {
    if (value) {
      return value;
    }

    if (!promise) {
      promise = fn().then((x) => {
        value = x;
        return x;
      });
    }

    throw promise;
  };
}

const getUser = newGetter(async () => {
  await new Promise((r) => setTimeout(r, 1000));
  return { id: 123 };
});

export default function Index() {
  return (
    <Something>
      First <Link to="/2">forward</Link>
      <Suspense fallback={<Something2>Fallback</Something2>}>
        <Suspended />
      </Suspense>
    </Something>
  );
}

function Suspended() {
  const user = getUser();
  return <Container>{user.id}</Container>;
}

const Something = styled.div`
  padding: 10px;
`;

const Something2 = styled.div`
  color: red;
`;

const Container = styled.div`
  background-color: blue;
  color: white;
  &:hover {
    background-color: green;
  }
`;
