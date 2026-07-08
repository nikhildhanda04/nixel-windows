export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  count: number = 5
): void {
  const now = performance.now() / 1000;

  for (let i = 0; i < count; i++) {
    const phase = ((now * 3 + i * 0.7) % 1.0);
    const angle = (i * Math.PI * 2) / count;
    const dist = 30 + phase * 25;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist + 10;
    const alpha = (1 - phase) * 0.9;
    const size = 4;

    ctx.save();
    ctx.fillStyle = `rgba(255, 204, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, size / 2, size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawRecordingIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number,
  recordingStartTime: number
): void {
  const now = performance.now() / 1000;
  const elapsed = now - recordingStartTime;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const timer = `${mins}:${String(secs).padStart(2, "0")}`;

  const pulse = 0.7 + 0.3 * Math.sin(now * 4);
  const dotRadius = 5;
  const dotX = cx - 28;
  const dotY = cy + halfChar + 16;

  // Red pulsing dot
  ctx.save();
  ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
  ctx.beginPath();
  ctx.ellipse(dotX, dotY, dotRadius, dotRadius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Timer text
  ctx.save();
  ctx.font = "bold 14px monospace";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.strokeText(timer, dotX + 10, dotY + 5);
  ctx.fillStyle = "white";
  ctx.fillText(timer, dotX + 10, dotY + 5);
  ctx.restore();
}
