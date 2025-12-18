import { useState } from "react";
import { Box, Container, Flex } from "@radix-ui/themes";
import TopNavigation from "./components/TopNavigation/TopNavigation";
import MediaBrowser from "./components/MediaBrowser/MediaBrowser";
import Composition from "./components/Composition/Composition";
import ModuleArea from "./components/ModuleArea/ModuleArea";

function App() {
  const [count, setCount] = useState(0);

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
    </Flex>
  );
}

export default App;
