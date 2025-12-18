import { Provider as StoreProvider } from "jotai";
import React, { type PropsWithChildren } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { store } from "../store/store";

type Props = {};

const Providers = ({ children }: PropsWithChildren<Props>) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <StoreProvider store={store}>{children}</StoreProvider>
    </DndProvider>
  );
};

export default Providers;
