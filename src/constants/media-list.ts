import type { AppIcons } from "../components/primitives/Icon/icons";

export type ListItemData = {
  title: string;
  icon: AppIcons;
};

/**
 * This is the list of buttons in the media browser that
 * act as the "categories" for other items.
 */
export const MEDIA_BROWSER_CATEGORIES_LIST: Record<string, ListItemData> = {
  samples: {
    title: "Samples",
    icon: "samples",
  },
  effects: {
    title: "Effects",
    icon: "effects",
  },
};

export type MediaBrowserCategory = keyof typeof MEDIA_BROWSER_CATEGORIES_LIST;

export type MediaBrowserListData = ListItemData & {
  id: MediaBrowserCategory;
};
