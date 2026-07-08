export interface CalendarBubble {
  id: string;
  title: string;
  startTime: number;
  opacity: number;
  targetOpacity: number;
}

export interface ReminderBubble {
  id: string;
  title: string;
  addedAt: number;
  opacity: number;
}

const BUBBLE_FADE_SPEED = 5.0;

export function updateBubbleFade(bubble: CalendarBubble, dt: number): void {
  const speed = BUBBLE_FADE_SPEED;
  if (bubble.targetOpacity > bubble.opacity) {
    bubble.opacity = Math.min(1, bubble.opacity + dt * speed);
  } else if (bubble.targetOpacity < bubble.opacity) {
    bubble.opacity = Math.max(0, bubble.opacity - dt * speed);
  }
}

export function drawCalendarBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number,
  text: string,
  opacity: number
): void {
  if (opacity <= 0.01 || !text) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  const font = "14px 'Segoe UI', sans-serif";
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;

  const padX = 16;
  const padY = 12;
  const dotRadius = 3.5;
  const dotGap = 10;
  const contentW = dotRadius * 2 + dotGap + textWidth;
  const bw = contentW + padX * 2;
  const bh = 24 + padY * 2;

  const bx = cx - bw / 2;
  const by = cy + halfChar + 24;

  // Glass pill background
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  roundRect(ctx, bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.restore();

  // Blue dot
  ctx.save();
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.ellipse(bx + padX + dotRadius, by + bh / 2, dotRadius, dotRadius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Text
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + padX + dotRadius * 2 + dotGap, by + bh / 2);
  ctx.restore();

  ctx.restore();
}

export function drawReminderBubbles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfChar: number,
  bubbles: ReminderBubble[]
): void {
  const baseY = cy + halfChar + 52;
  const stepY = 48;

  const visible = bubbles.slice(Math.max(0, bubbles.length - 3));

  for (let i = 0; i < visible.length; i++) {
    const b = visible[i];
    if (b.opacity <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = b.opacity;

    const font = "13px 'Segoe UI', sans-serif";
    ctx.font = font;
    const textWidth = ctx.measureText(b.title).width;

    const padX = 14;
    const padY = 10;
    const dotRadius = 3;
    const dotGap = 8;
    const bw = textWidth + padX * 2 + dotRadius * 2 + dotGap;
    const bh = 22 + padY * 2;
    const by = baseY + i * stepY - bh / 2;
    const bx = cx - bw / 2;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.restore();

    // Orange dot
    ctx.save();
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.ellipse(bx + padX + dotRadius, by + bh / 2, dotRadius, dotRadius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillText(b.title, bx + padX + dotRadius * 2 + dotGap, by + bh / 2);
    ctx.restore();

    ctx.restore();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
