import React, { useEffect, useRef, useState } from "react";
import { exportCompositionToAudioFile } from "../../../services/export";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import Text from "../../ui/Typography/Text";
import { Stack } from "../../../../styled-system/jsx";
import Progress from "../../ui/Progress/Progress";

type Props = {};

const ExportModalContent = (props: Props) => {
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const listenerRef = useRef<UnlistenFn>(null);

  // Get export progress from Rust backend
  useEffect(() => {
    if (isExporting) {
      const attachEvents = async () => {
        listenerRef.current = await listen("export_time", (event) => {
          // Returns a percent from 0-1
          setProgress(event.payload as number);
          console.log("got progress update", event.payload);
        });
      };

      attachEvents();
    }

    return () => {
      if (listenerRef.current) listenerRef.current();
    };
  }, [isExporting]);

  const handleStartExport = async () => {
    setProgress(0);
    setIsExporting(true);
    await exportCompositionToAudioFile();
    setIsExporting(false);
  };

  return (
    <Stack p={3}>
      <Progress value={progress * 100} title="Export progress" />
      <button disabled={isExporting} onClick={handleStartExport}>
        {isExporting ? "Exporting..." : "Export Audio"}
      </button>
    </Stack>
  );
};

export default ExportModalContent;
