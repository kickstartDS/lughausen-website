import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { useRegisterEvents, useSigmaContext } from "@react-sigma/core";
import { Command } from "cmdk";
import { bfsFromNode } from "graphology-traversal/bfs";
import { useCallback, useEffect, useState } from "react";
import { CameraState, Coordinates, NodeDisplayData } from "sigma/types";

const CosmosCommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  const registerEvents = useRegisterEvents();

  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const graph = sigma.getGraph();

  const getInboundRecursive = useCallback(
    (node: string, nodes: Set<string>) => {
      graph.forEachInboundNeighbor(node, (n) => {
        if (!nodes.has(n)) {
          nodes.add(n);
          getInboundRecursive(n, nodes);
        }
      });
    },
    [graph]
  );

  const onSelect = useCallback(
    (value: string) => {
      if (value === "Reset") {
        sigma.setSetting("nodeReducer", null);
        if (cameraState)
          sigma.getCamera().animate(cameraState, { duration: 500 });
      } else {
        setCameraState(sigma.getCamera().getState());

        const nodes = new Set<string>();
        getInboundRecursive(value, nodes);
        bfsFromNode(graph, value, (node) => {
          nodes.add(node);
        });
        sigma.setSetting("nodeReducer", (node, data) => {
          const res: Partial<NodeDisplayData> = { ...data };
          if (!nodes.has(node)) {
            res.hidden = true;
          } else if (node === value) {
            res.size = 4;
          } else {
            res.size = 2;
          }
          return res;
        });
        sigma.refresh({
          skipIndexation: true,
        });
        const nodePosition = sigma.getNodeDisplayData(value) as Coordinates;
        sigma.getCamera().animate(
          {
            x: nodePosition.x,
            y: nodePosition.y,
            ratio: 0.1,
          },
          {
            duration: 500,
          }
        );
      }

      sigma.refresh({
        skipIndexation: true,
      });

      setOpen(false);
    },
    [sigma, cameraState, setCameraState, getInboundRecursive, graph]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    registerEvents({
      clickNode: (event) => onSelect(event.node),
    });
  }, [registerEvents, onSelect]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="cosmos DialogContent"
    >
      <Command.Input />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Reset">
          <Command.Item onSelect={onSelect}>Reset</Command.Item>
        </Command.Group>
        <Command.Group heading="Tokens">
          {graph.nodes().map((node, index) => (
            <Command.Item key={index} onSelect={onSelect}>
              {node}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};

export default CosmosCommandMenu;
