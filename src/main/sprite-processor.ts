import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { spritePath } from "./paths";

function nearestNeighborResize(
  src: Buffer,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Buffer {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const si = (srcY * srcW + srcX) * 4;
      const di = (y * dstW + x) * 4;
      dst[di] = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = src[si + 3];
    }
  }
  return dst;
}

export async function processSpriteSheet(inputPath: string): Promise<string> {
  const src = PNG.sync.read(fs.readFileSync(inputPath));
  let w = src.width;
  let h = src.height;
  let pixels = src.data;

  if (w !== 256 || h !== 640) {
    pixels = nearestNeighborResize(pixels, w, h, 256, 640);
    w = 256;
    h = 640;
  }

  const arr = new Uint8ClampedArray(pixels);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = arr[i];
      const g = arr[i + 1];
      const b = arr[i + 2];
      const a = arr[i + 3];

      if (a < 30) {
        arr[i + 3] = 0;
        continue;
      }
      if (r > 150 && g < 100 && b > 150) {
        arr[i] = 0;
        arr[i + 1] = 0;
        arr[i + 2] = 0;
        arr[i + 3] = 0;
        continue;
      }
      arr[i + 3] = 255;
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    const copy = new Uint8ClampedArray(arr);
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
            arr[i + 3] = 0;
          }
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = arr[i + 3];
      if (a > 0 && a < 200) {
        let solidNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              if (arr[(ny * w + nx) * 4 + 3] > 200) solidNeighbor = true;
            }
          }
        }
        if (solidNeighbor) {
          arr[i + 3] = 255;
        } else {
          arr[i + 3] = 0;
        }
      }
    }
  }

  const dest = spritePath();
  const out = new PNG({ width: w, height: h });
  out.data = Buffer.from(arr);
  fs.writeFileSync(dest, PNG.sync.write(out));

  return dest;
}
