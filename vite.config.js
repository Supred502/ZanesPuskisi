import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  build: {
    // Keep chunk sizes smaller by extracting large node_modules into separate chunks.
    // This helps avoid a single bundle becoming >500kb after minification.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor_react";
            }
            if (id.includes("firebase")) {
              return "vendor_firebase";
            }
            if (id.includes("@tailwindcss") || id.includes("tailwindcss")) {
              return "vendor_tailwind";
            }
            return "vendor_misc";
          }
        },
      },
    },
  },
});
