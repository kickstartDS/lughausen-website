import { useState } from "react";
import { normal } from "color-blend";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BoxModelIcon,
  PaddingIcon,
  MarginIcon,
  DesktopIcon,
  LaptopIcon,
  MobileIcon,
  ScissorsIcon,
  ReloadIcon,
  DashboardIcon,
  MixIcon,
} from "@radix-ui/react-icons";
import iwanthue from "iwanthue";
import hexRgb from "hex-rgb";
import rgbHex from "rgb-hex";

import louvain from "graphology-communities-louvain";
import { Sigma } from "sigma";
import { Attributes } from "graphology-types";
import { useSigmaContext } from "@react-sigma/core";
import { bindWebGLLayer, createContoursProgram } from "@sigma/layer-webgl";

import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import { isBreakpointState, useCosmosGraphContext } from "../GraphContext";
import BreakpointRadioItem from "./components/BreakpointRadioItem";
import BreakpointIcon from "./components/BreakpointIcon";
import IconTooltip from "./components/IconTooltip";
import {
  background,
  getCommunityName,
  hexRgbToRgba,
  rgbaToString,
} from "../helpers";

const CosmosMainToolbar = () => {
  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const { setInvertedState, breakpointState, setBreakpointState } =
    useCosmosGraphContext();

  const [showCommunities, setShowCommunities] = useState(false);
  const {
    currentGraphName,
    setCurrentGraphName,
    graph,
    automaticRelayout,
    setAutomaticRelayout,
  } = useCosmosGraphContext();

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
    !(currentGraphName === "design-system")
      ? setCurrentGraphName("design-system")
      : setCurrentGraphName("full");
  };

  const setBreakpoint = (breakpoint: string) => {
    if (isBreakpointState(breakpoint)) setBreakpointState(breakpoint);
  };

  return (
    <div className="MainToolbarWrapper">
      <Toolbar.Root className="ToolbarRoot" aria-label="General Settings">
        <Toolbar.Button className="ToolbarButton">
          <IconTooltip Icon={MixIcon} text="Focus component" />
        </Toolbar.Button>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.Button onClick={toggleCommunities} className="ToolbarButton">
          <IconTooltip Icon={DashboardIcon} text="Toggle communities" />
        </Toolbar.Button>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.ToggleGroup
          className="ToolbarToggleGroup"
          type="multiple"
          aria-label="Automatic relayout"
          onValueChange={() => setAutomaticRelayout(!automaticRelayout)}
        >
          <Toolbar.ToggleItem
            className="ToolbarToggleItem"
            value="automatic"
            aria-label="Activate automatic relayout"
          >
            <IconTooltip Icon={ReloadIcon} text="Activate automatic relayout" />
          </Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.ToggleGroup
          className="ToolbarToggleGroup"
          type="multiple"
          aria-label="Show ksDS"
          onValueChange={toggleHide}
        >
          <Toolbar.ToggleItem
            className="ToolbarToggleItem"
            value="ksds"
            aria-label="Hide unconnected"
          >
            <IconTooltip
              Icon={ScissorsIcon}
              text="Hide unconnected ksDS token"
            />
          </Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
        <Toolbar.Separator className="ToolbarSeparator" />
        <Toolbar.ToggleGroup
          className="ToolbarToggleGroup"
          type="single"
          defaultValue="both"
          aria-label="Inverted"
          onValueChange={setInvertedState}
        >
          <Toolbar.ToggleItem
            className="ToolbarToggleItem"
            value="both"
            aria-label="Both"
          >
            <IconTooltip
              Icon={BoxModelIcon}
              text="Display both default and inverted states"
            />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className="ToolbarToggleItem"
            value="default"
            aria-label="Default"
          >
            <IconTooltip Icon={MarginIcon} text="Display default state" />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className="ToolbarToggleItem"
            value="inverted"
            aria-label="Inverted"
          >
            <IconTooltip Icon={PaddingIcon} text="Display inverted state" />
          </Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
        <Toolbar.Separator className="ToolbarSeparator" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Toolbar.Button
              className="ToolbarButton"
              style={{ marginLeft: "auto" }}
            >
              <BreakpointIcon name={breakpointState} />
            </Toolbar.Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="DropdownMenuContent"
              sideOffset={15}
            >
              <DropdownMenu.Label className="DropdownMenuLabel">
                Choose breakpoint
              </DropdownMenu.Label>
              <DropdownMenu.RadioGroup
                value={breakpointState}
                onValueChange={setBreakpoint}
              >
                <BreakpointRadioItem name="All" value="all" />
                <BreakpointRadioItem
                  name="Desktop"
                  value="desktop"
                  Icon={DesktopIcon}
                />
                <BreakpointRadioItem
                  name="Laptop"
                  value="laptop"
                  Icon={LaptopIcon}
                />
                <BreakpointRadioItem
                  name="Tablet"
                  value="tablet"
                  Icon={MobileIcon}
                />
                <BreakpointRadioItem
                  name="Phone"
                  value="phone"
                  Icon={MobileIcon}
                />
              </DropdownMenu.RadioGroup>
              <DropdownMenu.Arrow className="DropdownMenuArrow" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Toolbar.Root>
    </div>
  );
};

export default CosmosMainToolbar;
