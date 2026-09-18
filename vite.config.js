import { defineConfig } from "vite";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  appType: "spa",
  base: process.env.BASE || "/",
  plugins: [
    {
      name: "spa-404",
      closeBundle() {
        try {
          copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
        } catch {
          // dist missing in non-build runs
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
