import { listen, UnlistenFn } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import LineGraph from "./LineGraph";

type Props = {};

const Waveform = (props: Props) => {
  return <LineGraph animated />;
};

export default Waveform;
