import { Menu, MenuItem, Submenu } from "@tauri-apps/api/menu";
import { store } from "../store/store";
import { settingsModalVisibleStore } from "../store/app";

// Optional: This is how you load an icon
// const menuIcon = await Image.fromPath('../src/assets/icon.png');

const fileSubmenu = await Submenu.new({
  text: "File",
  //   icon: menuIcon,
  items: [
    await MenuItem.new({
      id: "new",
      text: "New Composition",
      action: () => {
        console.log("New clicked");
      },
    }),
    await MenuItem.new({
      id: "open",
      text: "Open Composition",
      action: () => {
        console.log("Open clicked");
      },
    }),
    await MenuItem.new({
      id: "save_as",
      text: "Save Composition",
      action: () => {
        console.log("Save As clicked");
      },
    }),
  ],
});

const editSubmenu = await Submenu.new({
  text: "Edit",
  items: [
    await MenuItem.new({
      id: "settings",
      text: "Settings",
      action: () => {
        const prevValue = store.get(settingsModalVisibleStore);
        store.set(settingsModalVisibleStore, !prevValue);
      },
    }),
  ],
});

export async function createDesktopMenu() {
  const menu = await Menu.new({
    items: [fileSubmenu, editSubmenu],
  });

  // If a window was not created with an explicit menu or had one set explicitly,
  // this menu will be assigned to it.
  menu.setAsAppMenu();
}
