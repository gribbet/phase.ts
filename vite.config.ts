import { defineConfig } from "@gribbet/vite-config";

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/jsx-runtime.ts", "src/jsx-dev-runtime.ts"],
    dts: true,
    platform: "browser",
    sourcemap: true,
    target: "esnext",
  },
});
