import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

export async function saveAudioDialog(prevPath?: string) {
  const path = await save({
    title: "Save audio file as",

    // @TODO: Default to the composition name
    defaultPath: prevPath && prevPath !== "" ? prevPath : "My song",

    filters: [
      {
        name: "Audio Files",
        extensions: ["wav"],
      },
    ],
  });

  return path;
}

export async function exportCompositionToAudioFile(path: string) {
  let result = await invoke("export_file", { savePath: path });

  console.log("export result", result);
}
