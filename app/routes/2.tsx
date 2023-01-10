import { Link } from "@remix-run/react";
import styled from "styled-components/macro";

export default function Index() {
  return (
    <Something>
      Something Important <Link to="/">back</Link>
    </Something>
  );
}

const Something = styled.div`
  padding: 10px;
  color: gray;
`;
