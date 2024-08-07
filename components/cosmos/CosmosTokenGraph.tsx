import { FC, useEffect, useMemo, CSSProperties } from "react";
import Graph, { MultiDirectedGraph } from "graphology";
import EdgeCurveProgram, {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from "@sigma/edge-curve";
import { EdgeArrowProgram } from "sigma/rendering";
import { Settings } from "sigma/settings";

import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { SerializedGraph } from "graphology-types";

import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { graph } from "@/helpers/token";

import CosmosCommandMenu from "./CosmosCommandMenu";
import CosmosToolbar from "./CosmosToolbar";

import "@react-sigma/core/lib/react-sigma.min.css";
import { forEachConnectedComponent } from "graphology-components";
import {
  CosmosGraphProvider,
  useCosmosGraphContext,
} from "./CosmosGraphContext";

const getDesignSystemSubGraph = (
  graph: Graph<GraphologyNodeType, GraphologyEdgeType>
) => {
  const subGraph = graph.copy();

  const nodes = new Set<string>();
  forEachConnectedComponent(subGraph, (component) => {
    if (
      component.some(
        (node) =>
          node.startsWith("--c-") ||
          node.startsWith("--l-") ||
          node.startsWith("--dsa-")
      )
    ) {
      for (const node of component) {
        if (!nodes.has(node)) nodes.add(node);
      }
    }
  });
  for (const node of subGraph.nodes()) {
    if (!nodes.has(node)) subGraph.dropNode(node);
  }

  return subGraph;
};

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

const CosmosTokenGraphLoader: React.FC = () => {
  const loadGraph = useLoadGraph<GraphologyNodeType, GraphologyEdgeType>();
  const { graph } = useCosmosGraphContext();
  const { assign } = useLayoutForceAtlas2({
    iterations: 100,
    outputReducer: (_node, data) => {
      if (data.hidden) {
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: "parallelIndex",
      edgeMaxIndexAttribute: "parallelMaxIndex",
    });

    graph.forEachEdge((edge, { parallelIndex, parallelMaxIndex }) => {
      if (typeof parallelIndex === "number") {
        graph.mergeEdgeAttributes(edge, {
          type: "curved",
          curvature:
            DEFAULT_EDGE_CURVATURE +
            (3 * DEFAULT_EDGE_CURVATURE * parallelIndex) /
              (parallelMaxIndex || 1),
        });
      } else {
        graph.setEdgeAttribute(edge, "type", "straight");
      }
    });

    loadGraph(graph);
    assign();
  }, [loadGraph, graph, assign]);

  return null;
};

export const CosmosTokenGraph: FC<{ style?: CSSProperties }> = ({ style }) => {
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
      <CosmosGraphProvider
        graphs={{
          full: graphology,
          "design-system": dsGraphology,
        }}
      >
        <CosmosTokenGraphLoader />
        <CosmosToolbar />
        <CosmosCommandMenu />
      </CosmosGraphProvider>
    </SigmaContainer>
  );
};
