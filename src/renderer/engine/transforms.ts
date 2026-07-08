export function easeOutBounce(t: number): number {
  t = Math.max(0, Math.min(1, t));
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  else if (t < 2 / d1) { const t2 = t - 1.5 / d1; return n1 * t2 * t2 + 0.75; }
  else if (t < 2.5 / d1) { const t2 = t - 2.25 / d1; return n1 * t2 * t2 + 0.9375; }
  else { const t2 = t - 2.625 / d1; return n1 * t2 * t2 + 0.984375; }
}

export function computeStateTransforms(
  state: string,
  t: number,
  dragLagX: number,
  dragLagY: number
): { bounce: number; wiggle: number; scale: number } {
  let bounce = 0;
  let wiggle = 0;
  let scale = 1;

  switch (state) {
    case "idle":
      bounce = Math.sin(t * 3) * 2;
      break;
    case "walk":
      bounce = Math.sin(t * 8) * 3;
      break;
    case "typing":
      wiggle = Math.sin(t * 25) * 2.5;
      bounce = Math.sin(t * 6) * 1.5;
      break;
    case "thinking":
      bounce = Math.sin(t * 1.5) * 1;
      break;
    case "done": {
      const p = ((t * 1000) % 500) / 500;
      if (p < 0.5) bounce = p * 4 * 40;
      else bounce = (1 - p) * 4 * 40;
      scale = 1.1;
      break;
    }
    case "dragging":
      scale = 1.2;
      wiggle = Math.max(-18, Math.min(18, dragLagX));
      bounce = Math.max(-12, Math.min(12, dragLagY));
      break;
    case "pounce": {
      const pT = ((t * 1000) % 700) / 700;
      if (pT < 0.3) { scale = 1.0; bounce = 0; }
      else if (pT < 0.5) { scale = 1.15; bounce = (pT - 0.3) * 80; }
      else if (pT < 0.8) { scale = 1.05; bounce = (0.8 - pT) * 40; }
      else { scale = 1.0; bounce = 0; }
      break;
    }
    case "petted":
      bounce = Math.sin(t * 2.5) * 1.5;
      break;
    case "alert":
      bounce = Math.abs(Math.sin(t * 8)) * 4;
      wiggle = Math.sin(t * 12) * 1.5;
      break;
    case "recording":
      bounce = Math.sin(t * 2) * 1.2;
      break;
    case "momReady": {
      const p = ((t * 1000) % 600) / 600;
      if (p < 0.5) bounce = p * 4 * 30;
      else bounce = (1 - p) * 4 * 30;
      scale = 1.08;
      break;
    }
    case "writingMOM":
      wiggle = Math.sin(t * 25) * 2.5;
      bounce = Math.sin(t * 6) * 1.5;
      break;
  }

  return { bounce, wiggle, scale };
}
