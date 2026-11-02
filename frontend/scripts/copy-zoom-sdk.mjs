// Copies the self-contained Zoom component-view SDK and the React 18 build it
// expects as globals into public/, so the meeting page can load them as plain
// scripts. Bundling them would hand the SDK Next's React 19 instead.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@zoom/meetingsdk/package.json"));
const { version } = JSON.parse(readFileSync(join(sdkDir, "package.json"), "utf8"));
const target = join(process.cwd(), "public", "zoom-sdk", version);

mkdirSync(target, { recursive: true });
for (const file of [
  "lib/vendor/react.min.js",
  "lib/vendor/react-dom.min.js",
  "zoom-meeting-embedded-ES5.min.js",
]) {
  copyFileSync(join(sdkDir, "dist", file), join(target, file.split("/").pop()));
}
console.log(`Zoom SDK ${version} copied to public/zoom-sdk/${version}`);
