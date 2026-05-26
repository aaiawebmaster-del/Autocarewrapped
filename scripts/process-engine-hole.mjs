/**
 * Converts black "hole" pixels in the overlay PNG to transparency
 * so the full engine layer shows through in the browser.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, '../src/assets/engine-hole-overlay.png');
const output = path.join(__dirname, '../src/assets/engine-hole-frame.png');

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Near-black hole + outer letterbox black → transparent
  if (r < 40 && g < 40 && b < 40) {
    data[i + 3] = 0;
  }
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(output);

console.log(`Wrote ${output}`);
