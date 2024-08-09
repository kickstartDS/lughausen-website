import { FC, useMemo, CSSProperties } from "react";
import { MultiDirectedGraph } from "graphology";
import EdgeCurveProgram from "@sigma/edge-curve";
import { EdgeArrowProgram } from "sigma/rendering";
import { Settings } from "sigma/settings";

import * as Tooltip from "@radix-ui/react-tooltip";
import { SigmaContainer } from "@react-sigma/core";
import { SerializedGraph } from "graphology-types";

import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { graph } from "@/helpers/token";

import CosmosCommandMenu from "./command/CommandMenu";
import CosmosMainToolbar from "./toolbars/MainToolbar";
import CosmosTokenToolbar from "./toolbars/TokenToolbar";

import "@react-sigma/core/lib/react-sigma.min.css";
import { CosmosGraphProvider } from "./GraphContext";
import CosmosViewToolbar from "./toolbars/ViewToolbar";
import { getDesignSystemSubGraph } from "./helpers";

const graphology = new MultiDirectedGraph<
  GraphologyNodeType,
  GraphologyEdgeType
>();
graphology.import(
  graph.getGraphologySerialized() as SerializedGraph<
    GraphologyNodeType,
    GraphologyEdgeType
  >
);
const dsGraphology = getDesignSystemSubGraph(graphology);

const TokenGraph: FC<{ style?: CSSProperties }> = ({ style }) => {
  const settings: Partial<Settings> = useMemo(
    () => ({
      allowInvalidContainer: true,
      renderEdgeLabels: true,
      defaultEdgeType: "straight",
      edgeProgramClasses: {
        straight: EdgeArrowProgram,
        curved: EdgeCurveProgram,
      },
      labelColor: { color: "#999" },
      defaultNodeColor: "black",
    }),
    []
  );

  return (
    <SigmaContainer
      style={style}
      graph={MultiDirectedGraph<GraphologyNodeType, GraphologyEdgeType>}
      settings={settings}
    >
      <Tooltip.Provider delayDuration={700} skipDelayDuration={300}>
        <CosmosGraphProvider
          graphs={{
            full: graphology,
            "design-system": dsGraphology,
          }}
        >
          <CosmosMainToolbar />
          <CosmosTokenToolbar />
          <CosmosViewToolbar />
          <CosmosCommandMenu />
        </CosmosGraphProvider>
      </Tooltip.Provider>
    </SigmaContainer>
  );
};

export default TokenGraph;
