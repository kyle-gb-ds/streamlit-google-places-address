import {
  FrontendRenderer,
  FrontendRendererArgs,
} from "@streamlit/component-v2-lib";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import AddressSearch, {
  AddressSearchDataShape,
  AddressSearchStateShape,
} from "./AddressSearch";
import "./styles.css";

const reactRoots: WeakMap<FrontendRendererArgs["parentElement"], Root> =
  new WeakMap();

const AddressSearchRoot: FrontendRenderer<
  AddressSearchStateShape,
  AddressSearchDataShape
> = (args) => {
  const { data, parentElement, setStateValue } = args;

  const rootElement = parentElement.querySelector(".react-root");
  if (!rootElement) {
    throw new Error("Unexpected: React root element not found");
  }

  let reactRoot = reactRoots.get(parentElement);
  if (!reactRoot) {
    reactRoot = createRoot(rootElement);
    reactRoots.set(parentElement, reactRoot);
  }

  reactRoot.render(
    <StrictMode>
      <AddressSearch data={data} setStateValue={setStateValue} />
    </StrictMode>
  );

  return () => {
    const existingRoot = reactRoots.get(parentElement);
    if (existingRoot) {
      existingRoot.unmount();
      reactRoots.delete(parentElement);
    }
  };
};

export default AddressSearchRoot;