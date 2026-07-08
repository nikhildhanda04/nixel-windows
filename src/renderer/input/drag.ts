import { NikxelState } from "../../shared/types";
import { StateMachine } from "../engine/state-machine";
import { SpriteRenderer } from "../engine/sprite-renderer";
import { HALF_CHAR, CHAR_SIZE, FRAME_SIZE, stateRowMap, stateFrameCount } from "../../shared/constants";

interface DragState {
  active: boolean;
  initialScreenX: number;
  initialScreenY: number;
  initialWindowX: number;
  initialWindowY: number;
  lastScreenX: number;
  lastScreenY: number;
}

const dragState: DragState = {
  active: false,
  initialScreenX: 0,
  initialScreenY: 0,
  initialWindowX: 0,
  initialWindowY: 0,
  lastScreenX: 0,
  lastScreenY: 0,
};

export function setupDrag(
  canvas: HTMLCanvasElement,
  stateMachine: StateMachine,
  renderer: SpriteRenderer
): void {
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!hitTestSprite(renderer, x, y, rect.width, rect.height)) return;

    dragState.active = true;
    dragState.initialScreenX = e.screenX;
    dragState.initialScreenY = e.screenY;
    dragState.initialWindowX = rect.left;
    dragState.initialWindowY = rect.top;
    dragState.lastScreenX = e.screenX;
    dragState.lastScreenY = e.screenY;

    stateMachine.setState(NikxelState.dragging);
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragState.active) return;

    const dx = e.screenX - dragState.initialScreenX;
    const dy = e.screenY - dragState.initialScreenY;
    const newX = dragState.initialWindowX + dx;
    const newY = dragState.initialWindowY + dy;

    // Compute drag velocity for inertia wiggle
    const vx = e.screenX - dragState.lastScreenX;
    const vy = e.screenY - dragState.lastScreenY;
    renderer.dragLagX = vx;
    renderer.dragLagY = vy;

    dragState.lastScreenX = e.screenX;
    dragState.lastScreenY = e.screenY;

    if (window.nikxelAPI) {
      window.nikxelAPI.moveWindow(newX, newY);
    }
  });

  window.addEventListener("mouseup", () => {
    if (!dragState.active) return;
    dragState.active = false;

    stateMachine.setState(NikxelState.idle);
    renderer.triggerSpringBack();
    renderer.dragLagX = 0;
    renderer.dragLagY = 0;
  });
}

function hitTestSprite(
  renderer: SpriteRenderer,
  x: number,
  y: number,
  viewW: number,
  viewH: number
): boolean {
  if (renderer.puff.avatarHidden) return false;

  const cx = viewW / 2;
  const cy = viewH / 2;

  // Get current renderer state for transforms
  // Simple bounding-box check within the character area
  const halfChar = HALF_CHAR;
  const dx = x - cx;
  const dy = y - cy;

  // Check if within a slightly padded character bounding box
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < halfChar + 10;
}
