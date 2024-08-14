import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import Graph from "graphology";
import { forEachConnectedComponent } from "graphology-components";
import hexRgb from "hex-rgb";
import rgbHex from "rgb-hex";

export const background = { r: 2, g: 53, b: 66, a: 1 };

export function rgbaToString(rgba: {
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  return `#${rgbHex(rgba.r, rgba.g, rgba.b)}`;
}

export function hexRgbToRgba(hex: string, alpha: number = 0) {
  const { red: r, green: g, blue: b, alpha: a } = hexRgb(hex);
  return { r, g, b, a: alpha };
}

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
        .replaceAll(/[0-9]{1,2}/g, "")
        .trim()
    )
    .join(" ");
  const communityNameFrequency = wordFreq(communityNameInput);
  const communityName = Object.keys(communityNameFrequency)
    .sort((a, b) => communityNameFrequency[b] - communityNameFrequency[a])
    .slice(0, 3)
    .join("/");
  return communityName;
}

export function getDesignSystemSubGraph(
  graph: Graph<GraphologyNodeType, GraphologyEdgeType>
): Graph<GraphologyNodeType, GraphologyEdgeType> {
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
}
