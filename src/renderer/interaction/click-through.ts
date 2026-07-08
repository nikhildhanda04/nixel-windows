// Click-through is handled by CSS:
// body has `pointer-events: none` — transparent areas pass clicks through
// canvas has `pointer-events: auto` — character area captures clicks
// No additional JS wiring needed.
export function setupClickThrough(_canvas: HTMLCanvasElement): void {
  // CSS handles it
}
