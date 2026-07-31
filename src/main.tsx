import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./App.tsx";
import { Theme } from "@radix-ui/themes";
import Providers from "./components/Providers.tsx";
import AppWrapper from "./components/AppWrapper.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <Providers>
        <Theme appearance="dark">
          <App />
        </Theme>
      </Providers>
    </AppWrapper>
  </StrictMode>,
);
