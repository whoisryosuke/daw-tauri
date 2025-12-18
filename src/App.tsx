import { useEffect, useRef, useState } from "react";
import { Box, Container, Flex } from "@radix-ui/themes";
import TopNavigation from "./components/TopNavigation/TopNavigation";
import MediaBrowser from "./components/MediaBrowser/MediaBrowser";
import Composition from "./components/Composition/Composition";
import ModuleArea from "./components/ModuleArea/ModuleArea";
import DNDTest from "./DNDTest";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

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
    <Flex
      height="100dvh"
      direction="column"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <TopNavigation />
      <Flex style={{ flex: 1 }}>
        <MediaBrowser />
        <Composition />
      </Flex>
      <Flex>
        <ModuleArea />
      </Flex>
      <DNDTest />
    </Flex>
  );
}

export default App;
