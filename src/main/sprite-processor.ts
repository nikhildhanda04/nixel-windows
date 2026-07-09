import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { spritePath } from "./paths";

const COLS = 4;
const ROWS = 10;
const SLOT_SIZE = 64;
const TARGET_W = 256;
const TARGET_H = 640;

function getPixel(pixels: Buffer, w: number, x: number, y: number): { r: number; g: number; b: number; a: number } {
  const i = (y * w + x) * 4;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
}

function setPixel(pixels: Buffer, w: number, x: number, y: number, r: number, g: number, b: number, a: number): void {
  const i = (y * w + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

function removeMagenta(pixels: Buffer, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const { r, g, b, a } = getPixel(pixels, w, x, y);
      if (a < 30) {
        setPixel(pixels, w, x, y, 0, 0, 0, 0);
      } else if (r > 150 && g < 100 && b > 150) {
        setPixel(pixels, w, x, y, 0, 0, 0, 0);
      } else {
        setPixel(pixels, w, x, y, r, g, b, 255);
      }
    }
  }
}

function edgeCleanPass(pixels: Buffer, w: number, h: number): void {
  const copy = Buffer.from(pixels);
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
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && copy[(ny * w + nx) * 4 + 3] < 30) {
              transparentNeighbors++;
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

function hardenEdges(pixels: Buffer, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = pixels[i + 3];
      if (a > 0 && a < 200) {
        let solidNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && pixels[(ny * w + nx) * 4 + 3] > 200) {
              solidNeighbor = true;
            }
          }
        }
        pixels[i + 3] = solidNeighbor ? 255 : 0;
      }
    }
  }
}

function findCharBounds(
  pixels: Buffer, w: number, h: number
): { x1: number; y1: number; x2: number; y2: number } | null {
  let x1 = w, y1 = h, x2 = 0, y2 = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getPixel(pixels, w, x, y).a > 30) {
        found = true;
        x1 = Math.min(x1, x);
        y1 = Math.min(y1, y);
        x2 = Math.max(x2, x);
        y2 = Math.max(y2, y);
      }
    }
  }
  if (!found) return null;
  return { x1: Math.max(0, x1 - 3), y1: Math.max(0, y1 - 3), x2: Math.min(w - 1, x2 + 3), y2: Math.min(h - 1, y2 + 3) };
}

function addWhiteOutline(charData: Buffer, cw: number, ch: number): { data: Buffer; w: number; h: number } {
  const ow = cw + 4, oh = ch + 4;
  const outline = Buffer.alloc(ow * oh * 4, 0);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let hasCharNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = x - 2 + dx, sy = y - 2 + dy;
          if (sx >= 0 && sx < cw && sy >= 0 && sy < ch && charData[(sy * cw + sx) * 4 + 3] > 100) {
            hasCharNeighbor = true;
          }
        }
      }
      if (hasCharNeighbor) {
        const cx = x - 2, cy = y - 2;
        const isChar = cx >= 0 && cx < cw && cy >= 0 && cy < ch && charData[(cy * cw + cx) * 4 + 3] > 100;
        if (!isChar) {
          setPixel(outline, ow, x, y, 255, 255, 255, 255);
        }
      }
    }
  }
  // Paste char on top of outline
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const srcI = (y * cw + x) * 4;
      if (charData[srcI + 3] > 0) {
        const dstI = ((y + 2) * ow + (x + 2)) * 4;
        outline[dstI] = charData[srcI];
        outline[dstI + 1] = charData[srcI + 1];
        outline[dstI + 2] = charData[srcI + 2];
        outline[dstI + 3] = charData[srcI + 3];
      }
    }
  }
  return { data: outline, w: ow, h: oh };
}

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
  const sw = src.width;
  const sh = src.height;

  // If already 256x640, do magenta removal + edge cleanup directly
  if (sw === TARGET_W && sh === TARGET_H) {
    const arr = new Uint8ClampedArray(src.data);
    const buf = Buffer.from(arr);
    removeMagenta(buf, sw, sh);
    for (let p = 0; p < 3; p++) edgeCleanPass(buf, sw, sh);
    hardenEdges(buf, sw, sh);
    const dest = spritePath();
    const out = new PNG({ width: sw, height: sh });
    out.data = buf;
    fs.writeFileSync(dest, PNG.sync.write(out));
    return dest;
  }

  // Detect grid: try 4 cols × 10 rows
  const cellW = Math.floor(sw / COLS);
  const cellH = Math.floor(sh / ROWS);

  const output = Buffer.alloc(TARGET_W * TARGET_H * 4, 0);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx1 = col * cellW;
      const cy1 = row * cellH;
      const cw = Math.min(cellW, sw - cx1);
      const ch = Math.min(cellH, sh - cy1);

      // Extract cell
      const cellPixels = Buffer.alloc(cw * ch * 4);
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const { r, g, b, a } = getPixel(src.data, sw, cx1 + x, cy1 + y);
          const di = (y * cw + x) * 4;
          cellPixels[di] = r;
          cellPixels[di + 1] = g;
          cellPixels[di + 2] = b;
          cellPixels[di + 3] = a;
        }
      }

      // Remove magenta on cell
      removeMagenta(cellPixels, cw, ch);
      for (let p = 0; p < 3; p++) edgeCleanPass(cellPixels, cw, ch);
      hardenEdges(cellPixels, cw, ch);

      // Find character bounds
      const bounds = findCharBounds(cellPixels, cw, ch);
      if (!bounds) continue;

      const charW = bounds.x2 - bounds.x1 + 1;
      const charH = bounds.y2 - bounds.y1 + 1;
      if (charW < 1 || charH < 1) continue;

      // Extract character
      const charData = Buffer.alloc(charW * charH * 4);
      for (let y = 0; y < charH; y++) {
        for (let x = 0; x < charW; x++) {
          const { r, g, b, a } = getPixel(cellPixels, cw, bounds.x1 + x, bounds.y1 + y);
          const di = (y * charW + x) * 4;
          charData[di] = r;
          charData[di + 1] = g;
          charData[di + 2] = b;
          charData[di + 3] = a;
        }
      }

      // Scale to fit in ~60px
      const maxDim = SLOT_SIZE - 4; // leave 2px margin on each side
      const scale = Math.min(maxDim / charW, maxDim / charH);
      const nw = Math.max(1, Math.round(charW * scale));
      const nh = Math.max(1, Math.round(charH * scale));
      const scaled = nearestNeighborResize(charData, charW, charH, nw, nh);

      // Add white outline
      const outlined = addWhiteOutline(scaled, nw, nh);

      // Place into output slot (centered)
      const dx = col * SLOT_SIZE + Math.floor((SLOT_SIZE - outlined.w) / 2);
      const dy = row * SLOT_SIZE + Math.floor((SLOT_SIZE - outlined.h) / 2);
      for (let y = 0; y < outlined.h; y++) {
        for (let x = 0; x < outlined.w; x++) {
          const srcI = (y * outlined.w + x) * 4;
          if (outlined.data[srcI + 3] > 0) {
            const tx = dx + x, ty = dy + y;
            if (tx >= 0 && tx < TARGET_W && ty >= 0 && ty < TARGET_H) {
              const dstI = (ty * TARGET_W + tx) * 4;
              output[dstI] = outlined.data[srcI];
              output[dstI + 1] = outlined.data[srcI + 1];
              output[dstI + 2] = outlined.data[srcI + 2];
              output[dstI + 3] = outlined.data[srcI + 3];
            }
          }
        }
      }
    }
  }

  const dest = spritePath();
  const out = new PNG({ width: TARGET_W, height: TARGET_H });
  out.data = output;
  fs.writeFileSync(dest, PNG.sync.write(out));
  return dest;
}
