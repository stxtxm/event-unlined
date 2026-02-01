import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";

  return {
    plugins: [react()],
    base: mode === "production" ? "/event-unlined/" : "/",
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5000",
          changeOrigin: true,
        },
      },
    },
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || ""),
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});
