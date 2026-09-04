import React, { useEffect, useRef, useState } from "react";
import {
  exportCompositionToAudioFile,
  saveAudioDialog,
} from "../../../services/export";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import Text from "../../ui/Typography/Text";
import { Stack } from "../../../../styled-system/jsx";
import Progress from "../../ui/Progress/Progress";
import { css } from "../../../../styled-system/css";
import Button from "../../ui/Button";

const subtitleStyle = css({
  minWidth: "20",
  color: "gray.10",
});

const fileInputStyle = css({
  flex: 1,
  border: 0,
  bg: "transparent",

  color: "blue.10",
  textDecoration: "underline",
  cursor: "pointer",
});

type Props = {
  close: () => void;
};

const ExportModalContent = ({ close, ...props }: Props) => {
  const [path, setPath] = useState<string>("");
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
    // Reset state + enable exporting flag
    setProgress(0);
    setIsExporting(true);

    await exportCompositionToAudioFile(path);

    // Finished? Push progress to end since sync misses it sometimesf
    setProgress(1);
    setIsExporting(false);
  };

  const handleSelectFile = async () => {
    const newPath = await saveAudioDialog(path);
    if (newPath) setPath(newPath);
  };

  const isPathEmpty = isExporting || path == "";
  const isExportDisabled = isExporting || isPathEmpty;

  return (
    <Stack p={3}>
      <Stack flexDir="row">
        <Text className={subtitleStyle}>Path</Text>
        <input
          className={fileInputStyle}
          readOnly
          value={path}
          onClick={handleSelectFile}
        />
      </Stack>
      <Progress value={progress * 100} title=" " />
      <Stack flexDir="row">
        <Button
          title={
            isPathEmpty
              ? "Select a place to save the file first"
              : "Exports audio to selected file"
          }
          colorPalette="blue"
          disabled={isExportDisabled}
          onClick={handleStartExport}
        >
          {isExporting ? "Exporting..." : "Export Audio"}
        </Button>
        <Button onClick={close}>Cancel</Button>
      </Stack>
    </Stack>
  );
};

export default ExportModalContent;
