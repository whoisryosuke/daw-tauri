import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { webGPUManagerStore } from "../../store/webgpu";
import WebGPUManager from "./WebGPUManager";

type Props = {};

const WebGPUProvider = (props: Props) => {
  const [store, setStore] = useAtom(webGPUManagerStore);

  const initStore = async () => {
    const newStore = new WebGPUManager();
    try {
      await newStore.init();
      setStore(newStore);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (store) return;

    initStore();

    return () => {
      // @TODO: Cleanup store
    };
  }, []);

  return <></>;
};

export default WebGPUProvider;
