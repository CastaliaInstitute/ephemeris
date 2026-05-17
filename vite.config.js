import { defineConfig } from "vite";

/** Project site: https://castaliainstitute.github.io/ephemeris/ */
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/ephemeris/",
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["swisseph-wasm"],
  },
}));
