import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Providers from "./components/Providers.tsx";
import AppWrapper from "./components/AppWrapper.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <Providers>
        <App />
      </Providers>
    </AppWrapper>
  </StrictMode>,
);
