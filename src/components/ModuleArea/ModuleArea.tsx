import React from "react";
import Waveform from "../Waveform";
import DebugSynthControls from "../debug/DebugSynthControls";
import { Box, Stack } from "../../../styled-system/jsx";
import EffectModules from "./EffectModules/EffectModules";
import MidiModule from "./TrackModules/MidiModule";
import { Tabs } from "@base-ui/react";
import { selectedTrackAtom, tracksAtom } from "../../store/composition";
import { useAtomValue } from "jotai";
import { sva } from "../../../styled-system/css";

const styles = sva({
  slots: ["tabRoot", "tabPanelContainer", "tabPanel", "tabList", "tabButton"],
  base: {
    tabRoot: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
    },
    tabPanelContainer: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    tabPanel: {
      display: "flex",
      flex: 1,
    },
    tabList: {
      display: "flex",
      gap: 1,
      fontSize: 1,
    },
    tabButton: {
      px: 3,
      py: 1,
      borderRadius: 2,

      backgroundColor: {
        base: "gray.2",
        _hover: "blue.4",
        _active: "blue.3",
      },
      color: {
        base: "gray.11",
        _hover: "blue.12",
        _active: "blue.9",
      },
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderColor: {
        base: "gray.5",
        _hover: "blue.6",
        _active: "blue.4",
      },

      _motionSafe: {
        transitionProperty: "background-color, color, border-color",
        transitionTimingFunction: "ease-in-out",
        transitionDuration: "slow",
      },
    },
  },
});

type Props = {};

const ModuleArea = (props: Props) => {
  const selectedTrackId = useAtomValue(selectedTrackAtom);
  const tracks = useAtomValue(tracksAtom);

  const currentTrack = tracks.find((track) => track.id == selectedTrackId);
  const trackType = currentTrack?.trackType;

  const classes = styles();

  return (
    <Stack flexDir="row" gap={2} height="100%" p={2}>
      <Waveform />
      <Tabs.Root className={classes.tabRoot}>
        <div className={classes.tabPanelContainer}>
          {trackType && (
            <Tabs.Panel value="type" className={classes.tabPanel}>
              <MidiModule currentTrack={currentTrack} />
            </Tabs.Panel>
          )}
          <Tabs.Panel value="effects" className={classes.tabPanel}>
            <EffectModules />
          </Tabs.Panel>
        </div>
        <Tabs.List className={classes.tabList}>
          {trackType && (
            <Tabs.Tab value="type" className={classes.tabButton}>
              {trackType}
            </Tabs.Tab>
          )}
          <Tabs.Tab value="effects" className={classes.tabButton}>
            Effects
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      {/* <DebugSynthControls /> */}
    </Stack>
  );
};

export default ModuleArea;
