export function drawThinkingDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number,
  frameIndex: number,
  opacity: number
): void {
  if (opacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  const dotY = cy + halfChar + 22;
  const dotSpacing = 16;
  const dotRadius = 5;
  const dotCount = Math.min(3, frameIndex + 1);

  for (let i = 0; i < dotCount; i++) {
    const dx = cx + (i - 1) * dotSpacing;
    ctx.save();
    // Outer glow
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(dx, dotY, dotRadius + 2, dotRadius + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner dot
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(dx, dotY, dotRadius, dotRadius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
