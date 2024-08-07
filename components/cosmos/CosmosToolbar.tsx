import { useState } from "react";
import { normal } from "color-blend";
import * as Toolbar from "@radix-ui/react-toolbar";
import iwanthue from "iwanthue";
import hexRgb from "hex-rgb";
import rgbHex from "rgb-hex";

import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { forEachConnectedComponent } from "graphology-components";
import { Sigma } from "sigma";
import { Attributes } from "graphology-types";
import { useSigmaContext } from "@react-sigma/core";
import { NodeDisplayData } from "sigma/types";
import { bindWebGLLayer, createContoursProgram } from "@sigma/layer-webgl";

import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { useCosmosGraphContext } from "./CosmosGraphContext";

export function wordFreq(string: string) {
  return string
    .replace(/[.]/g, "")
    .split(/\s/)
    .reduce<Record<string, number>>(
      (map, word) =>
        Object.assign(map, {
          [word]: map[word] ? map[word] + 1 : 1,
        }),
      {}
    );
}

export function getCommunityName(
  graph: Graph<GraphologyNodeType, GraphologyEdgeType>,
  community: string
) {
  const communityNodes = graph.filterNodes(
    (_, attr) => attr.community === community
  );
  const communityNameInput = communityNodes
    .map((communityNode) =>
      communityNode
        .replaceAll("--", " ")
        .replaceAll("__", " ")
        .replaceAll("-", " ")
        .replaceAll("_", " ")
        .trim()
    )
    .join(" ");
  const communityNameFrequency = wordFreq(communityNameInput);
  const communityName = Object.keys(communityNameFrequency)
    .sort((a, b) => communityNameFrequency[b] - communityNameFrequency[a])
    .slice(0, 3)
    .join(" ");
  return communityName;
}

const CosmosToolbar = () => {
  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const [ksHidden, setKsHidden] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);
  const { setCurrentGraphName } = useCosmosGraphContext();
  const { assign } = useLayoutForceAtlas2({
    iterations: 100,
    outputReducer: (node, data) => {
      if (data.hidden) {
        return null;
      }
      return data;
    },
  });

  const graph = sigma.getGraph();

  const toggleCommunities = () => {
    if (showCommunities) {
      sigma.setSetting("nodeReducer", null);
      setShowCommunities(false);
    } else {
      louvain.assign(graph, { nodeCommunityAttribute: "community" });
      const communities = new Set<string>();
      const communitiesCount = new Map<number, number>();

      graph.forEachNode((_, attrs) => {
        if (attrs.community) {
          communitiesCount.set(
            parseInt(attrs.community),
            (communitiesCount.get(parseInt(attrs.community)) || 0) + 1
          );
          communities.add(attrs.community);
        }
      });
      const communitiesArray = Array.from(communities).filter((community) => {
        return (communitiesCount.get(parseInt(community)) || 0) > 25;
      });

      const palette: Record<string, string> = iwanthue(
        communitiesArray.length,
        {
          colorSpace: "intense",
          seed: "cool-palette",
          quality: 100,
        }
      ).reduce(
        (iter, color, i) => ({
          ...iter,
          [communitiesArray[i]]: color,
        }),
        {}
      );

      const checkboxesContainer = document.createElement("div");
      checkboxesContainer.style.position = "absolute";
      checkboxesContainer.style.right = "10px";
      checkboxesContainer.style.bottom = "10px";
      document.body.append(checkboxesContainer);

      communitiesArray.forEach((community, index) => {
        const id = `cb-${community}`;
        const checkboxContainer = document.createElement("div");

        const communityName = getCommunityName(graph, community);
        checkboxContainer.innerHTML += `
      <input type="checkbox" id="${id}" name="">
      <label for="${id}" style="color:${palette[community]}">${communityName}</label>
    `;
        checkboxesContainer.append(checkboxContainer);
        const checkbox = checkboxesContainer.querySelector(
          `#${id}`
        ) as HTMLInputElement;

        let clean: null | (() => void) = null;
        const background = { r: 2, g: 53, b: 66, a: 1 };
        const rgbaToString = (rgba: {
          r: number;
          g: number;
          b: number;
          a: number;
        }) => `#${rgbHex(rgba.r, rgba.g, rgba.b)}`;
        const hexRgbToRgba = (hex: string, alpha: number = 0) => {
          const { red: r, green: g, blue: b, alpha: a } = hexRgb(hex);
          return { r, g, b, a: alpha };
        };
        const toggle = () => {
          if (clean) {
            clean();
            clean = null;
          } else {
            clean = bindWebGLLayer(
              `community-${community}`,
              sigma as unknown as Sigma<Attributes, Attributes, Attributes>,
              createContoursProgram(
                graph.filterNodes((_, attr) => attr.community === community),
                {
                  radius: 100,
                  border: {
                    color: rgbaToString(
                      normal(background, hexRgbToRgba(palette[community], 0.8))
                    ),
                    thickness: 1,
                  },
                  levels: [
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.5)
                        )
                      ),
                      threshold: 0.3,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.45)
                        )
                      ),
                      threshold: 2,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.4)
                        )
                      ),
                      threshold: 4,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.3)
                        )
                      ),
                      threshold: 8,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.2)
                        )
                      ),
                      threshold: 10,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.15)
                        )
                      ),
                      threshold: 15,
                    },
                    {
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(palette[community], 0.1)
                        )
                      ),
                      threshold: 21,
                    },
                  ],
                }
              )
            );
          }
        };

        checkbox.addEventListener("change", toggle);

        if (!index) {
          checkbox.checked = true;
          toggle();
        }
      });
    }
  };

  const toggleHide = () => {
    !ksHidden
      ? setCurrentGraphName("design-system")
      : setCurrentGraphName("full");
    setKsHidden(!ksHidden);
  };

  return (
    <div className="ToolbarWrapper">
      <Toolbar.Root className="ToolbarRoot" aria-label="Cosmos options">
        <Toolbar.Button onClick={toggleCommunities} className="ToolbarButton">
          {showCommunities ? "Hide Communities" : "Show Communities"}
        </Toolbar.Button>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.Button className="ToolbarButton" onClick={assign}>
          Relayout
        </Toolbar.Button>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.Button className="ToolbarButton" onClick={toggleHide}>
          {ksHidden ? "Show KS" : "Hide KS"}
        </Toolbar.Button>
      </Toolbar.Root>
    </div>
  );
};

export default CosmosToolbar;
