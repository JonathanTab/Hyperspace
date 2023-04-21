import pkg from "../package.json";

const manifest = {
  action: {
    default_icon: {
      128: "icons/active-128.png",
    },
    default_popup: "src/entries/popup/index.html",
  },
  background: {
    service_worker: "src/entries/background/main.js",
  },
  host_permissions: ["*://*/*"],
  permissions: ["tabs", "notifications", "storage"],
  icons: {
    128: "icons/active-128.png",
  }
};

export function getManifest() {
  return {
    author: pkg.author,
    description: pkg.description,
    name: pkg.displayName,
    version: pkg.version,
    manifest_version: 3,
    ...manifest,
  };
}
