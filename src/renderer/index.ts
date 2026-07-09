import { NikxelState } from "../shared/types";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../shared/constants";
import { StateMachine } from "./engine/state-machine";
import { SpriteRenderer } from "./engine/sprite-renderer";
import { setupDrag } from "./input/drag";
import { setupClickThrough } from "./interaction/click-through";

const canvas = document.getElementById("nikxel-canvas") as HTMLCanvasElement;

const stateMachine = new StateMachine();
const renderer = new SpriteRenderer(canvas, stateMachine);

let pageantAnimId: ReturnType<typeof requestAnimationFrame> | null = null;
let pageantActive = false;
let pageantTargetX = 0;
let pageantTargetY = 0;

function loadSprite(): void {
  // Try local custom first, then fallback
  if (window.nikxelAPI) {
    window.nikxelAPI.onSpriteProcessed((success, path) => {
      if (success && path) {
        const customImg = new Image();
        customImg.onload = () => renderer.setSpriteSheet(customImg);
        customImg.src = `file://${path}`;
      }
    });

    window.nikxelAPI.onSpriteReset(() => {
      // Default sprite is re-sent by main via default-sprite IPC
    });

    window.nikxelAPI.onDefaultSprite((dataUrl) => {
      const img = new Image();
      img.onload = () => renderer.setSpriteSheet(img);
      img.src = dataUrl;
    });
  }
}

function setupIPCListeners(): void {
  if (!window.nikxelAPI) return;

  window.nikxelAPI.onKeystroke(() => {
    renderer.recordKeystroke();
    stateMachine.triggerTyping();
  });

  window.nikxelAPI.onCalendarEvents((events) => {
    if (events.length === 0) return;
    const event = events[0];
    renderer.calendarBubble = {
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      opacity: 0,
      targetOpacity: 1,
    };
    stateMachine.triggerAlert();

    setTimeout(() => {
      if (renderer.calendarBubble && renderer.calendarBubble.id === event.id) {
        renderer.calendarBubble.targetOpacity = 0;
      }
    }, 10000);
  });

  window.nikxelAPI.onPageantStart(() => {
    startPageant();
  });
}

function gameLoop(): void {
  const canvas2 = canvas;
  const rect = canvas2.getBoundingClientRect();
  if (rect.width !== VIEW_WIDTH || rect.height !== VIEW_HEIGHT) {
    renderer.resize(VIEW_WIDTH, VIEW_HEIGHT);
  }

  renderer.tick();
  requestAnimationFrame(gameLoop);
}

function pageantLoop(): void {
  if (!pageantActive) return;

  const rect = canvas.getBoundingClientRect();
  const currentX = rect.left;
  const currentY = rect.top;

  const dx = pageantTargetX - currentX;
  const dy = pageantTargetY - currentY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 10) {
    // Reached target, pick new
    pickNewTarget();
  } else {
    // Move toward target
    const speed = 1.5;
    const nx = currentX + (dx / dist) * speed;
    const ny = currentY + (dy / dist) * speed;

    if (stateMachine.state !== NikxelState.walk) {
      stateMachine.setState(NikxelState.walk);
    }

    // Update mouse direction so character faces the right way
    stateMachine.updateMouse(pageantTargetX, currentX);

    if (window.nikxelAPI) {
      window.nikxelAPI.moveWindow(Math.round(nx), Math.round(ny));
    }
  }

  pageantAnimId = requestAnimationFrame(pageantLoop);
}

function pickNewTarget(): void {
  const maxX = window.screen.width - VIEW_WIDTH;
  const maxY = window.screen.height - VIEW_HEIGHT - 48;

  pageantTargetX = Math.random() * maxX;
  pageantTargetY = Math.random() * maxY;

  // Chance to pounce at destination
  if (Math.random() < 0.4) {
    setTimeout(() => {
      if (pageantActive) stateMachine.triggerPounce();
    }, 800);
  }

  // Pause for a bit before next walk
  setTimeout(() => {
    if (pageantActive) pickNewTarget();
  }, 3000 + Math.random() * 5000);
}

function startPageant(): void {
  if (pageantActive) return;
  pageantActive = true;
  pickNewTarget();
  pageantAnimId = requestAnimationFrame(pageantLoop);
}

function stopPageant(): void {
  pageantActive = false;
  if (pageantAnimId) {
    cancelAnimationFrame(pageantAnimId);
    pageantAnimId = null;
  }
}

// Initialize
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

loadSprite();
setupIPCListeners();

setupDrag(canvas, stateMachine, renderer);
setupClickThrough(canvas);

// Trigger entrance puff
renderer.triggerPuff();

// Start render loop
gameLoop();

// Handle trackpad/mouse movement for facing direction
document.addEventListener("mousemove", (e) => {
  renderer.setMousePosition(e.screenX, e.screenY);
});
