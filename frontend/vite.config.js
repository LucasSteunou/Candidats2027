import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // content/ and METHODOLOGIE.md live one level up, next to the Python checks.
    fs: { allow: [".."] },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
