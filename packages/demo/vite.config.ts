import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@tbib-image-viewer/react/styles.css",
        replacement: path.resolve(__dirname, "../react/src/styles/index.css"),
      },
      {
        find: "@tbib-image-viewer/react",
        replacement: path.resolve(__dirname, "../react/src"),
      },
      {
        find: "@tbib-image-viewer/core",
        replacement: path.resolve(__dirname, "../core/src"),
      },
    ],
  },
  server: {
    port: 5173,
    open: false,
  },
});
