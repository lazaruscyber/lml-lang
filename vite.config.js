import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [
    {
      name: "news-rewrite",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/news" || req.url === "/news/") {
            req.url = "/news.html";
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        news: resolve(__dirname, "news.html"),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
