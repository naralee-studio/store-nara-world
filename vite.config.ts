import { defineConfig } from "vite";
import { readdirSync, unlinkSync } from "node:fs";
export default defineConfig({
  base: "./",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [
    {
      name: "clean-generated-assets",
      writeBundle(_options, bundle) {
        for (const name of readdirSync("assets")) {
          if (/^nara-ui(?:-.*)?\.(?:js|css)$/.test(name) && !(name in bundle))
            unlinkSync(`assets/${name}`);
        }
      },
    },
  ],
  build: {
    outDir: "assets",
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: true,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        manualChunks: (id) =>
          id.includes("node_modules") && !/\/(Lightbox|BottomSheet)\//.test(id)
            ? "vendor"
            : undefined,
        entryFileNames: "nara-ui.js",
        chunkFileNames: "nara-ui-[name]-[hash].js",
        assetFileNames: (asset) =>
          asset.names?.some((name) => name.endsWith(".css"))
            ? "nara-ui.css"
            : "nara-ui-[name][extname]",
      },
    },
  },
});
