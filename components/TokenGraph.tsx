import { FC, useEffect, useMemo, CSSProperties } from "react";
import { MultiDirectedGraph } from "graphology";
import EdgeCurveProgram, {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from "@sigma/edge-curve";
import { EdgeArrowProgram } from "sigma/rendering";

import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { graph } from "@/helpers/token";
import { Attributes, SerializedGraph } from "graphology-types";

import "@react-sigma/core/lib/react-sigma.min.css";
import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { Settings } from "sigma/settings";
import CommandMenu from "./CommandMenu";
import CosmosToolbar from "./CosmosToolbar";

const Fa2: FC = () => {
  const { assign } = useLayoutForceAtlas2();

  useEffect(() => {
    assign();
  }, [assign]);

  return null;
};

const TokenGraph: React.FC = () => {
  const loadGraph = useLoadGraph<GraphologyNodeType, GraphologyEdgeType>();

  useEffect(() => {
    const graphology = new MultiDirectedGraph<
      GraphologyNodeType,
      GraphologyEdgeType
    >();
    graphology.import(
      graph.getGraphologySerialized() as SerializedGraph<
        GraphologyNodeType,
        GraphologyEdgeType,
        Attributes
      >
    );

    indexParallelEdgesIndex(graphology, {
      edgeIndexAttribute: "parallelIndex",
      edgeMaxIndexAttribute: "parallelMaxIndex",
    });

    graphology.forEachEdge((edge, { parallelIndex, parallelMaxIndex }) => {
      if (typeof parallelIndex === "number") {
        graphology.mergeEdgeAttributes(edge, {
          type: "curved",
          curvature:
            DEFAULT_EDGE_CURVATURE +
            (3 * DEFAULT_EDGE_CURVATURE * parallelIndex) /
              (parallelMaxIndex || 1),
        });
      } else {
        graphology.setEdgeAttribute(edge, "type", "straight");
      }
    });

    loadGraph(graphology);
  }, [loadGraph]);

  return null;
};

export const TokenGraphContainer: FC<{ style?: CSSProperties }> = ({
  style,
}) => {
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
      <CosmosToolbar />
      <CommandMenu />
      <TokenGraph />
      <Fa2 />
    </SigmaContainer>
  );
};
