export function drawOverheatTint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number,
  charSize: number,
  wiggle: number,
  bounce: number,
  intensity: number
): void {
  if (intensity <= 0) return;

  ctx.save();
  ctx.translate(cx + wiggle, cy + bounce);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.5})`;
  ctx.fillRect(-halfChar, -halfChar, charSize, charSize);
  ctx.restore();
}

export function drawSteam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number
): void {
  const now = performance.now() / 1000;
  const steamY = cy + halfChar - 15;

  for (let i = 0; i < 3; i++) {
    const phase = ((now * 2.5 + i * 1.1) % 2.2) / 2.2;
    const x = cx + (i - 1) * 14 + Math.sin(now + i) * 6;
    const y = steamY + phase * 25;
    const alpha = (1 - phase) * 0.7;
    const size = 3 + phase * 4;

    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, size / 2, size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function isOverheated(keyTimestamps: number[], wpmWindow: number, overheatWPM: number): { isHot: boolean; wpm: number } {
  const now = performance.now() / 1000;
  const recent = keyTimestamps.filter(ts => now - ts < wpmWindow);
  const wpm = (recent.length / 5.0) * (60.0 / wpmWindow);
  return { isHot: wpm > overheatWPM, wpm };
}
