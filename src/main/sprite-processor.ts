import sharp from "sharp";
import path from "path";
import fs from "fs";
import { spritePath } from "./paths";

export async function processSpriteSheet(inputPath: string): Promise<string> {
  const dest = spritePath();
  const img = sharp(inputPath);
  const metadata = await img.metadata();

  let srcW = metadata.width || 256;
  let srcH = metadata.height || 640;

  // Resize to 256x640 if different
  let resized = img;
  if (srcW !== 256 || srcH !== 640) {
    const scaleX = 256 / srcW;
    const scaleY = 640 / srcH;
    const scale = Math.min(scaleX, scaleY);
    srcW = Math.round(srcW * scale);
    srcH = Math.round(srcH * scale);
    resized = img.resize({ width: srcW, height: srcH, fit: "fill" });
  }

  // Get raw RGBA pixel data
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const pixels = new Uint8ClampedArray(data);

  // Pass 1: Chroma key magenta — R>150, G<100, B>150 → transparent
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 30) {
        pixels[i + 3] = 0;
        continue;
      }
      if (r > 150 && g < 100 && b > 150) {
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 0;
        continue;
      }
      pixels[i + 3] = 255;
    }
  }

  // Pass 2: Edge clean (3 passes) — magenta-tinted pixels next to alpha gaps → transparent
  for (let pass = 0; pass < 3; pass++) {
    const copy = new Uint8ClampedArray(pixels);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (copy[i + 3] < 200) continue;
        const r = copy[i];
        const g = copy[i + 1];
        const b = copy[i + 2];

        if (r > 100 && b > 100 && g / Math.max(r + b, 1) < 0.4) {
          let transparentNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (copy[(ny * w + nx) * 4 + 3] < 30) transparentNeighbors++;
              }
            }
          }
          if (transparentNeighbors >= 2) {
            pixels[i + 3] = 0;
          }
        }
      }
    }
  }

  // Pass 3: Harden semi-transparent edges
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = pixels[i + 3];
      if (a > 0 && a < 200) {
        let solidNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              if (pixels[(ny * w + nx) * 4 + 3] > 200) solidNeighbor = true;
            }
          }
        }
        if (solidNeighbor) {
          pixels[i + 3] = 255;
        } else {
          pixels[i + 3] = 0;
        }
      }
    }
  }

  // Save processed result
  await sharp(Buffer.from(pixels), { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(dest);

  return dest;
}
