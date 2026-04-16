import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  sourcemap: true,
  clean: true,
  noExternal: ["@job-pipeline/db", "@job-pipeline/shared"]
});
