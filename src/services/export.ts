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

  let result = await invoke("export_file", { savePath: path });

  console.log("export result", result);
}
