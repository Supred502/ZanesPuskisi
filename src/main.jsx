import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Use the application entry that assembles Navbar, ProductsGrid, AdminPanel, etc.
import App from "./App.jsx";

// Initialize theme from localStorage. If the user has a saved preference,
// apply it by adding a class to document.documentElement (`theme-light` or
// `theme-dark`). This allows CSS to provide explicit overrides independent
// from the OS `prefers-color-scheme`.
try {
  const stored = localStorage.getItem("theme");
  if (stored === "light") {
    document.documentElement.classList.add("theme-light");
    document.documentElement.classList.remove("theme-dark");
  } else if (stored === "dark") {
    document.documentElement.classList.add("theme-dark");
    document.documentElement.classList.remove("theme-light");
  }
} catch (e) {
  // ignore (server-side render safety or privacy restrictions)
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
