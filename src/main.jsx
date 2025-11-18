import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Use the application entry that assembles Navbar, ProductsGrid, AdminPanel, etc.
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
