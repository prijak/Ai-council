// One-time script to generate PWA icons from public/logo.png
// Run: node generate-icons.mjs
// Requires: npm install sharp --save-dev  (then remove it after if you want)

import sharp from "sharp";
import { mkdirSync } from "fs";

const src = "./public/logo.png";
const out = "./public/icons";

mkdirSync(out, { recursive: true });

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 14, g: 14, b: 26, alpha: 1 }, // #0e0e1a — your app bg
    })
    .png()
    .toFile(`${out}/icon-${size}.png`);
  console.log(`✓ public/icons/icon-${size}.png`);
}

console.log("\nDone. You can now uninstall sharp: npm uninstall sharp");
