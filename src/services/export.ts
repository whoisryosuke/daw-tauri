import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

export async function exportCompositionToAudioFile() {
  const path = await save({
    filters: [
      {
        name: "My Song",
        extensions: ["wav"],
      },
    ],
  });
  console.log(path);

  await invoke("export_file", { savePath: path });
}
