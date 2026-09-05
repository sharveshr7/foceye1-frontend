import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global listener for Vite dynamic preload / chunk loading errors
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[FOCEYE] Dynamic preload failed, reloading to latest deployment version:", event);
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
