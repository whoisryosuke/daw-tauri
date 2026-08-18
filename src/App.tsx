import { useEffect, useRef, useState } from "react";
import TopNavigation from "./components/TopNavigation/TopNavigation";
import MediaBrowser from "./components/MediaBrowser/MediaBrowser";
import Composition from "./components/Composition/Composition";
import ModuleArea from "./components/ModuleArea/ModuleArea";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Stack } from "../styled-system/jsx";
import { invoke } from "@tauri-apps/api/core";

function App() {
  return (
    <Stack height="100dvh" bg="gray.1" overflow="hidden">
      <TopNavigation />
      <Stack flexDir="row" flex={1} minHeight={0}>
        <MediaBrowser />
        <Composition />
      </Stack>
      <Stack flexDir="row" minHeight="200px">
        <ModuleArea />
      </Stack>
    </Stack>
  );
}

export default App;
