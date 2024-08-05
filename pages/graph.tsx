import dynamic from "next/dynamic";

import "@react-sigma/core/lib/react-sigma.min.css";

const sigmaStyle = {
  height: "100vh",
  width: "100vw",
  backgroundColor: "#023542",
};

export const DisplayGraph = () => {
  const isBrowser = () => typeof window !== "undefined";
  if (isBrowser()) {
    const TokenGraphContainer = dynamic(
      import("../components/TokenGraph").then((mod) => mod.TokenGraphContainer),
      { ssr: false }
    );
    return <TokenGraphContainer style={sigmaStyle} />;
  } else return null;
};

export default DisplayGraph;
