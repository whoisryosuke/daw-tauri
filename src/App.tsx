import { useEffect, useRef, useState } from "react";
import TopNavigation from "./components/TopNavigation/TopNavigation";
import MediaBrowser from "./components/MediaBrowser/MediaBrowser";
import Composition from "./components/Composition/Composition";
import ModuleArea from "./components/ModuleArea/ModuleArea";
import DNDTest from "./DNDTest";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Stack } from "../styled-system/jsx";

function App() {
  const [count, setCount] = useState(0);
  const listenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let startListen = async () => {
      listenRef.current = await listen("waveform", (event) => {
        // console.log("waveform event", event);
      });
    };
    startListen();

    return () => {
      listenRef.current?.();
    };
  }, []);

  return (
    <Stack height="100dvh" bg="gray.1">
      <TopNavigation />
      <Stack flexDir="row" flex={1}>
        <MediaBrowser />
        <Composition />
      </Stack>
      <Stack flexDir="row">
        <ModuleArea />
      </Stack>
      <DNDTest />
    </Stack>
  );
}

export default App;
