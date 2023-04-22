import {
  defineConfig
} from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from 'vite-svg-loader'
import webExtension from "@samrum/vite-plugin-web-extension";
import path from "path";
import {
  getManifest
} from "./src/manifest";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      svgLoader(),
      webExtension({
        manifest: getManifest(),
      }),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  };
});
