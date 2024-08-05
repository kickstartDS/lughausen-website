import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import * as Toolbar from "@radix-ui/react-toolbar";
import { useSigmaContext } from "@react-sigma/core";
import { forEachConnectedComponent } from "graphology-components";
import { useState } from "react";
import { NodeDisplayData } from "sigma/types";

const CosmosToolbar = () => {
  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const [ksHidden, setKsHidden] = useState(false);
  const graph = sigma.getGraph();

  const hideOnClick = () => {
    if (ksHidden) {
      sigma.setSetting("nodeReducer", null);
      setKsHidden(false);
    } else {
      const nodes = new Set<string>();
      forEachConnectedComponent(graph, (component) => {
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
      sigma.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };
        if (!nodes.has(node)) {
          res.hidden = true;
        }
        return res;
      });
      setKsHidden(true);
    }

    sigma.refresh({
      skipIndexation: true,
    });
  };

  return (
    <div className="ToolbarWrapper">
      <Toolbar.Root className="ToolbarRoot" aria-label="Cosmos options">
        <Toolbar.Button onClick={hideOnClick} className="ToolbarButton">
          {ksHidden ? "Show ksDS" : "Hide ksDS"}
        </Toolbar.Button>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.Link className="ToolbarLink">Lorem</Toolbar.Link>
      </Toolbar.Root>
    </div>
  );
};

export default CosmosToolbar;
