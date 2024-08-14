import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { bfsFromNode } from "graphology-traversal/bfs";
import {
  CameraState,
  Coordinates,
  EdgeDisplayData,
  NodeDisplayData,
} from "sigma/types";
import { useLoadGraph, useSigmaContext } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from "@sigma/edge-curve";
import { normal } from "color-blend";
import {
  background,
  getCommunityName,
  hexRgbToRgba,
  rgbaToString,
} from "./helpers";

export type CommunityCount = {
  count: number;
  name: string;
  index: number;
};

export const initialCameraState = { x: 0.5, y: 0.5, angle: 0, ratio: 1 };
export const ancestryStates = ["both", "ascendents", "descendents"] as const;
export const breakpointStates = [
  "all",
  "desktop",
  "laptop",
  "tablet",
  "phone",
] as const;
export const invertedStates = ["both", "default", "inverted"] as const;

export const isBreakpointState = (
  breakpoint: string
): breakpoint is (typeof breakpointStates)[number] => {
  return breakpointStates.includes(breakpoint as any);
};

export const isAncestryState = (
  ancestry: string
): ancestry is (typeof ancestryStates)[number] => {
  return ancestryStates.includes(ancestry as any);
};

const CosmosGraphContext = createContext<
  | {
      currentGraphName: string;
      setCurrentGraphName: (name: string) => void;
      graph: Graph<GraphologyNodeType, GraphologyEdgeType>;
      selectedToken: string;
      setSelectedToken: (token: string) => void;
      cameraState: CameraState | null;
      setCameraState: (state: CameraState) => void;
      automaticRelayout: boolean;
      setAutomaticRelayout: (value: boolean) => void;
      ancestryState: (typeof ancestryStates)[number];
      setAncestryState: (value: (typeof ancestryStates)[number]) => void;
      breakpointState: (typeof breakpointStates)[number];
      setBreakpointState: (value: (typeof breakpointStates)[number]) => void;
      invertedState: (typeof invertedStates)[number];
      setInvertedState: (value: (typeof invertedStates)[number]) => void;
      ancestryLevel: number;
      setAncestryLevel: (value: number) => void;
      communities: Record<string, CommunityCount>;
      setCommunities: (communities: Record<string, CommunityCount>) => void;
      activeComponents: Set<string>;
      setActiveComponents: (components: Set<string>) => void;
      components: Record<string, GraphologyNodeType[]>;
      setComponents: (components: Record<string, GraphologyNodeType[]>) => void;
    }
  | undefined
>(undefined);
export const CosmosGraphProvider: FC<
  PropsWithChildren<{
    graphs: Record<string, Graph<GraphologyNodeType, GraphologyEdgeType>>;
  }>
> = (props) => {
  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const loadGraph = useLoadGraph<GraphologyNodeType, GraphologyEdgeType>();
  const { assign } = useLayoutForceAtlas2({
    iterations: 100,
    outputReducer: (_node, data) => {
      if (data.hidden) {
        return null;
      }
      return data;
    },
  });

  const [communities, setCommunities] = useState<
    Record<string, CommunityCount>
  >({});

  const [components, setComponents] = useState<
    Record<string, GraphologyNodeType[]>
  >({});
  const [activeComponents, setActiveComponents] = useState<Set<string>>(
    new Set<string>()
  );

  const [currentGraphName, setCurrentGraphName] = useState<string>("full");
  const graph = props.graphs[currentGraphName];

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

    louvain.assign(graph, { nodeCommunityAttribute: "community" });

    const newCommunities: Record<string, CommunityCount> = {};
    const newComponents: Record<string, GraphologyNodeType[]> = {};

    graph.forEachNode((node, attrs) => {
      if (attrs.community) {
        const communityName = getCommunityName(graph, attrs.community);
        const communityKey = communityName.replace(/ /g, "-");
        newCommunities[communityKey] = {
          count: (newCommunities[communityKey]?.count || 0) + 1,
          name: communityName,
          index: parseInt(attrs.community),
        };
      }

      const matches = Array.from(
        node.matchAll(/--dsa-((?:[a-zA-Z]+-)*[a-zA-Z]+)/g)
      );
      if (
        matches &&
        matches.length > 0 &&
        attrs.selectors.some((selector) =>
          selector.startsWith(`.dsa-${matches[0][1]}`)
        )
      ) {
        newComponents[`.dsa-${matches[0][1]}`] ||= [];
        newComponents[`.dsa-${matches[0][1]}`].push(attrs);
      }
    });
    setCommunities(newCommunities);
    setComponents(newComponents);

    loadGraph(graph);
    assign();
  }, [loadGraph, graph, assign]);

  const camera = sigma.getCamera();

  const [selectedToken, setSelectedToken] = useState<string>("");
  const [cameraState, setCameraState] = useState<CameraState>(
    camera.getState()
  );
  const [automaticRelayout, setAutomaticRelayout] = useState<boolean>(false);
  const [ancestryState, setAncestryState] =
    useState<(typeof ancestryStates)[number]>("both");
  const [invertedState, setInvertedState] =
    useState<(typeof invertedStates)[number]>("both");
  const [breakpointState, setBreakpointState] =
    useState<(typeof breakpointStates)[number]>("all");
  const [ancestryLevel, setAncestryLevel] = useState<number>(0);

  const equalCameraState = (a: CameraState, b: CameraState) =>
    a.x === b.x && a.y === b.y && a.ratio === b.ratio && a.angle === b.angle;

  useEffect(() => {
    camera.animate(cameraState, { duration: 500 });
  }, [camera, cameraState]);

  useEffect(() => {
    const nodes = new Set<string>();
    const discoverNodes = (
      startNode: string,
      direction: (typeof ancestryStates)[number],
      level: number = 0
    ) => {
      if (direction === "both" || direction === "descendents") {
        bfsFromNode(
          graph,
          startNode,
          (node, _attrs) => {
            if (!nodes.has(node)) nodes.add(node);
          },
          {
            mode: "outbound",
          }
        );

        if (level < ancestryLevel) {
          for (const node of Array.from(nodes)) {
            if (node === startNode) continue;
            for (const additionalNode of graph.inboundNeighbors(node)) {
              if (!nodes.has(additionalNode))
                discoverNodes(additionalNode, direction, level + 1);
            }
          }
        }
      }

      if (direction === "both" || direction === "ascendents") {
        bfsFromNode(
          graph,
          startNode,
          (node, _attrs) => {
            if (!nodes.has(node)) nodes.add(node);
          },
          {
            mode: "inbound",
          }
        );

        if (level < ancestryLevel) {
          for (const node of Array.from(nodes)) {
            if (node === startNode) continue;
            for (const additionalNode of graph.outboundNeighbors(node)) {
              if (!nodes.has(additionalNode))
                discoverNodes(additionalNode, direction, level + 1);
            }
          }
        }
      }
    };
    const reduceNodes = () => {
      sigma.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };
        if (!nodes.has(node) && automaticRelayout) {
          res.hidden = true;
        } else if (!nodes.has(node) && !automaticRelayout) {
          res.color = rgbaToString(
            normal(background, hexRgbToRgba("#CCCCCC", 0.2))
          );
          res.size = 1;
        } else if (node === selectedToken) {
          res.size = 4;
          res.color = "#0294C1";
        } else {
          res.size = 2;
        }
        return res;
      });
      sigma.setSetting("edgeReducer", (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data };
        if (!nodes.has(graph.source(edge)) || !nodes.has(graph.target(edge))) {
          res.color = rgbaToString(
            normal(background, hexRgbToRgba("#CCCCCC", 0.4))
          );
        }
        return res;
      });
      sigma.refresh({
        skipIndexation: true,
      });
      if (automaticRelayout) assign();
    };

    if (selectedToken !== "") {
      discoverNodes(selectedToken, ancestryState);
      reduceNodes();

      const nodePosition = sigma.getNodeDisplayData(
        selectedToken
      ) as Coordinates;
      const currentCameraState = camera.getState();
      const targetCameraState =
        currentCameraState.ratio === initialCameraState.ratio &&
        currentCameraState.angle === initialCameraState.angle
          ? {
              x: nodePosition.x,
              y: nodePosition.y,
              ratio: 0.1,
              angle: 0,
            }
          : {
              x: nodePosition.x,
              y: nodePosition.y,
              ratio: currentCameraState.ratio,
              angle: currentCameraState.angle,
            };
      if (!equalCameraState(cameraState, targetCameraState))
        setCameraState(targetCameraState);
    } else if (activeComponents.size > 0) {
      for (const activeComponent of Array.from(activeComponents)) {
        for (const token of components[activeComponent]) {
          discoverNodes(token.label, ancestryState);
        }
      }

      reduceNodes();
    } else {
      sigma.setSetting("nodeReducer", null);
      sigma.setSetting("edgeReducer", null);
      sigma.refresh({
        skipIndexation: true,
      });
      if (automaticRelayout) assign();
      if (!equalCameraState(cameraState, initialCameraState))
        setCameraState(initialCameraState);
    }
  }, [
    selectedToken,
    graph,
    sigma,
    cameraState,
    automaticRelayout,
    assign,
    ancestryLevel,
    ancestryState,
    camera,
    activeComponents,
    components,
  ]);

  return (
    <CosmosGraphContext.Provider
      value={{
        currentGraphName,
        graph,
        setCurrentGraphName,
        selectedToken,
        setSelectedToken,
        cameraState,
        setCameraState,
        automaticRelayout,
        setAutomaticRelayout,
        ancestryState,
        setAncestryState,
        breakpointState,
        setBreakpointState,
        invertedState,
        setInvertedState,
        ancestryLevel,
        setAncestryLevel,
        communities,
        setCommunities,
        activeComponents,
        setActiveComponents,
        components,
        setComponents,
      }}
    >
      {props.children}
    </CosmosGraphContext.Provider>
  );
};

export const useCosmosGraphContext = () => {
  const context = useContext(CosmosGraphContext);
  if (!context) throw new Error("CosmosGraphContext not found");
  return context;
};
