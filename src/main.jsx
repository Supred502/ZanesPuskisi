import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Use the application entry that assembles Navbar, ProductsGrid, AdminPanel, etc.
import App from "./App.jsx";
import RotationProvider from "./contexts/RotationContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RotationProvider interval={3000}>
      <App />
    </RotationProvider>
  </StrictMode>
);

// Register PWA service worker in production to cache images and shell.
try {
  if (import.meta.env.PROD) {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  }
} catch {
  // ignore SW registration errors
}
