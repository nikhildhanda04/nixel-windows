export function drawDropShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, halfChar: number, bounce: number, isDragging: boolean): void {
  if (isDragging) return;

  const shadowY = cy - halfChar;
  const alpha = Math.max(0, 0.12 - (bounce > 0 ? bounce / 400 : 0));

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, shadowY - 4, 42, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
