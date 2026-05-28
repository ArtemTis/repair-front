import React from "react";
import Polimorphe from "./Polimorphe";
import { Page } from "./RenderProp";

const TestPage = () => {
  return (
    <div>
      <Polimorphe
        as="a"
        primary={true}
        children="123"
        href="https://google.com"
      />
      <Polimorphe children="not button" type="button" disabled />
      <Page />
    </div>
  );
};

export default TestPage;
