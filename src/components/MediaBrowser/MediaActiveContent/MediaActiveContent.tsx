import React, { JSX } from "react";
import ExpandablePanel from "../../primitives/ExpandablePanel/ExpandablePanel";
import type { MediaBrowserCategory } from "../../../constants/media-list";
import MediaSampleList from "./content/MediaSampleList";
import MediaEffectList from "./content/MediaEffectList";
import MediaPluginList from "./content/MediaPluginList";

const CONTENT_COMPONENTS: Record<
  MediaBrowserCategory,
  (props: any) => JSX.Element
> = {
  samples: MediaSampleList,
  effects: MediaEffectList,
  plugins: MediaPluginList,
};

type Props = {
  content: MediaBrowserCategory;
};

const MediaActiveContent = ({ content }: Props) => {
  const ContentComponent = CONTENT_COMPONENTS[content];

  return (
    <ExpandablePanel>
      <ContentComponent />
    </ExpandablePanel>
  );
};

export default MediaActiveContent;
