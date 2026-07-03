import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import "./styles/components.css";
import "./styles/landing.css";



const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "[SentinelAI] Root element #root not found in index.html. " +
      "Check that index.html contains <div id='root'></div>."
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
