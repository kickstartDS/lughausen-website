import { useEffect, useState } from "react";
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
  CheckIcon,
} from "@radix-ui/react-icons";

import { Sigma } from "sigma";
import { Attributes } from "graphology-types";
import { useSigmaContext } from "@react-sigma/core";
import { bindWebGLLayer, createContoursProgram } from "@sigma/layer-webgl";

import { GraphologyEdgeType, GraphologyNodeType } from "@/helpers/graph";
import {
  CommunityCount,
  isBreakpointState,
  useCosmosGraphContext,
} from "../GraphContext";
import BreakpointRadioItem from "./components/BreakpointRadioItem";
import BreakpointIcon from "./components/BreakpointIcon";
import IconTooltip from "./components/IconTooltip";
import { background, hexRgbToRgba, rgbaToString } from "../helpers";
import {
  getComponentName,
  getPalette,
  levelAlphas,
  levelThresholds,
} from "@/helpers/token";
import { NodeDisplayData } from "sigma/types";

const CosmosMainToolbar = () => {
  const { sigma } = useSigmaContext<GraphologyNodeType, GraphologyEdgeType>();
  const {
    setInvertedState,
    breakpointState,
    setBreakpointState,
    currentGraphName,
    setCurrentGraphName,
    graph,
    automaticRelayout,
    setAutomaticRelayout,
    communities,
    components,
    activeComponents,
    setActiveComponents,
  } = useCosmosGraphContext();

  const [showCommunities, setShowCommunities] = useState(false);
  const [filteredCommunities, setFilteredCommunities] = useState<
    Record<string, CommunityCount>
  >({});
  const [activeCommunities, setActiveCommunities] = useState<Set<number>>(
    new Set<number>()
  );
  const [palette, setPalette] = useState<Record<string, string>>({});

  useEffect(() => {
    if (communities) {
      const filteredCommunities = Object.values(communities).filter(
        (community) => community.count > 25
      );
      setFilteredCommunities(
        filteredCommunities.reduce<Record<string, CommunityCount>>(
          (acc, community) => {
            acc[community.index] = community;
            return acc;
          },
          {}
        )
      );
    }
  }, [communities]);

  useEffect(() => {
    if (filteredCommunities && Object.keys(filteredCommunities).length > 0)
      setPalette(getPalette(Object.values(filteredCommunities)));
  }, [filteredCommunities]);

  const toggleComponent = (component: string) => {
    const newActiveComponents = new Set(activeComponents);
    if (activeComponents.has(component)) {
      newActiveComponents.delete(component);
    } else {
      newActiveComponents.add(component);
    }
    setActiveComponents(newActiveComponents);
  };

  const toggleCommunity = (community: number) => {
    const newActiveCommunities = new Set(activeCommunities);
    if (activeCommunities.has(community)) {
      newActiveCommunities.delete(community);
    } else {
      newActiveCommunities.add(community);
    }
    setActiveCommunities(newActiveCommunities);
  };

  const toggleCommunities = () => {
    if (showCommunities) {
      sigma.setSetting("nodeReducer", null);
      setShowCommunities(false);
    } else {
      const communitiesArray = Object.values(communities).filter(
        (community) => community.count > 25
      );
      const palette = getPalette(communitiesArray);

      const checkboxesContainer = document.createElement("div");
      checkboxesContainer.style.position = "absolute";
      checkboxesContainer.style.right = "10px";
      checkboxesContainer.style.bottom = "10px";
      document.body.append(checkboxesContainer);

      communitiesArray.forEach((community, index) => {
        const id = `cb-${community.index}`;
        const checkboxContainer = document.createElement("div");

        checkboxContainer.innerHTML += `
      <input type="checkbox" id="${id}" name="">
      <label for="${id}" style="color:${palette[community.index]}">${
          community.name
        }</label>
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
                graph.filterNodes((_, attr) => {
                  if (
                    attr.community &&
                    parseInt(attr.community) === community.index
                  )
                    return true;
                }),
                {
                  radius: 100,
                  border: {
                    color: rgbaToString(
                      normal(
                        background,
                        hexRgbToRgba(palette[community.index], 0.8)
                      )
                    ),
                    thickness: 1,
                  },
                  levels: levelThresholds.reduce<
                    { color?: string | undefined; threshold: number }[]
                  >((acc, threshold, index) => {
                    acc.push({
                      color: rgbaToString(
                        normal(
                          background,
                          hexRgbToRgba(
                            palette[community.index],
                            levelAlphas[index]
                          )
                        )
                      ),
                      threshold,
                    });
                    return acc;
                  }, []),
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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Toolbar.Button
              className="ToolbarButton"
              style={{ marginLeft: "auto" }}
            >
              <IconTooltip Icon={MixIcon} text="Toggle components" />
            </Toolbar.Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="DropdownMenuContent"
              sideOffset={15}
            >
              <DropdownMenu.Label className="DropdownMenuLabel">
                Choose components
              </DropdownMenu.Label>

              {Object.keys(components).map((component, index) => (
                <DropdownMenu.CheckboxItem
                  className="DropdownMenuCheckboxItem"
                  checked={activeComponents.has(component)}
                  onCheckedChange={() => toggleComponent(component)}
                  key={index}
                >
                  <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {getComponentName(component)}
                </DropdownMenu.CheckboxItem>
              ))}

              <DropdownMenu.Arrow className="DropdownMenuArrow" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <Toolbar.Separator className="ToolbarSeparator" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Toolbar.Button
              className="ToolbarButton"
              style={{ marginLeft: "auto" }}
            >
              <IconTooltip Icon={DashboardIcon} text="Toggle communities" />
            </Toolbar.Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="DropdownMenuContent"
              sideOffset={15}
            >
              <DropdownMenu.Label className="DropdownMenuLabel">
                Choose communities
              </DropdownMenu.Label>

              {Object.values(filteredCommunities).map((community) => (
                <DropdownMenu.CheckboxItem
                  className="DropdownMenuCheckboxItem"
                  style={{ color: palette[community.index] }}
                  checked={activeCommunities.has(community.index)}
                  onCheckedChange={() => toggleCommunity(community.index)}
                  key={community.index}
                >
                  <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                    <CheckIcon />
                  </DropdownMenu.ItemIndicator>
                  {community.name}
                </DropdownMenu.CheckboxItem>
              ))}

              <DropdownMenu.Arrow className="DropdownMenuArrow" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
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
