import { defineConfig } from "vite";

/** Custom domain (root) + project Pages subpath via relative assets. */
export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["swisseph-wasm"],
  },
});
