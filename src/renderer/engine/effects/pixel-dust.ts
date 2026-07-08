const PALETTE = [
  "#ffffff",
  "#f5f5f5",
  "#dbdbdb",
  "#bdbdbd",
];

export interface PuffState {
  active: boolean;
  startTime: number;
  avatarHidden: boolean;
}

export function startPuff(puff: PuffState): void {
  puff.active = true;
  puff.startTime = performance.now() / 1000;
  puff.avatarHidden = true;
}

export function drawPixelPuff(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  puff: PuffState,
  puffDuration: number,
  puffRevealAt: number,
  onReveal: () => void
): void {
  if (!puff.active) return;

  const now = performance.now() / 1000;
  const raw = (now - puff.startTime) / puffDuration;

  if (raw >= 1) {
    puff.active = false;
    puff.avatarHidden = false;
    return;
  }

  const progress = Math.max(0, raw);
  const eased = 1 - Math.pow(1 - progress, 2.5);

  const baseRadius = 4;
  const maxRadius = 104;
  const radius = baseRadius + (maxRadius - baseRadius) * eased;

  if (puff.avatarHidden && progress >= puffRevealAt) {
    puff.avatarHidden = false;
    onReveal();
  }

  const baseAlpha = Math.max(0, 1 - progress) * 0.95;

  // Outer ring — 14 chunky pixel particles
  const outerCount = 14;
  for (let i = 0; i < outerCount; i++) {
    const baseAngle = (i / outerCount) * Math.PI * 2;
    const angleJ = ((i * 47) % 11 - 5) * 0.045;
    const angle = baseAngle + angleJ;
    const radJ = ((i * 31) % 9 - 4) * 2.5;
    const r = radius + radJ;
    const pxCenter = cx + Math.cos(angle) * r;
    const pyCenter = cy + Math.sin(angle) * r;

    const size = Math.floor(Math.max(3, 9 - progress * 5));
    const px = Math.floor(pxCenter - size / 2);
    const py = Math.floor(pyCenter - size / 2);

    ctx.save();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.globalAlpha = baseAlpha;
    ctx.fillRect(px, py, size, size);
    ctx.restore();
  }

  // Inner scatter
  const scatterCount = Math.floor((1 - progress) * 18) + 8;
  for (let i = 0; i < scatterCount; i++) {
    const seedA = ((i * 73) % 360) * Math.PI / 180;
    const seedR = ((i * 53) % 100) / 100 * radius * 0.8 + 4;
    const pxCenter = cx + Math.cos(seedA) * seedR;
    const pyCenter = cy + Math.sin(seedA) * seedR;
    const size = i % 4 === 0 ? 6 : 4;
    const px = Math.floor(pxCenter - size / 2);
    const py = Math.floor(pyCenter - size / 2);
    const alphaJ = ((i * 19) % 100) / 100 * 0.5 + 0.5;
    const alpha = baseAlpha * alphaJ;

    ctx.save();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.globalAlpha = alpha;
    ctx.fillRect(px, py, size, size);
    ctx.restore();
  }

  // Bright core
  if (progress < 0.35) {
    const coreFade = 1 - progress / 0.35;
    const coreSize = Math.floor(64 * coreFade + 28);
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = coreFade * 0.9;
    ctx.fillRect(
      Math.floor(cx - coreSize / 2),
      Math.floor(cy - coreSize / 2),
      coreSize,
      coreSize
    );
    ctx.restore();
  }
}
