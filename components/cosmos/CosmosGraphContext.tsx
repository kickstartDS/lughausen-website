import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";
import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import Graph from "graphology";

const CosmosGraphContext = createContext<
  | {
      currentGraphName: string;
      graph: Graph<GraphologyNodeType, GraphologyEdgeType>;
      setCurrentGraphName: (name: string) => void;
    }
  | undefined
>(undefined);
export const CosmosGraphProvider: FC<
  PropsWithChildren<{
    graphs: Record<string, Graph<GraphologyNodeType, GraphologyEdgeType>>;
  }>
> = (props) => {
  const [currentGraphName, setCurrentGraphName] = useState<string>("full");
  const graph = props.graphs[currentGraphName];

  return (
    <CosmosGraphContext.Provider
      value={{ currentGraphName, graph, setCurrentGraphName }}
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
