import { NikxelState } from "../shared/types";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../shared/constants";
import { StateMachine } from "./engine/state-machine";
import { SpriteRenderer } from "./engine/sprite-renderer";
import { setupDrag } from "./input/drag";
import { setupClickThrough } from "./interaction/click-through";

function log(level: string, message: string): void {
  if (window.nikxelAPI) {
    window.nikxelAPI.log(level, message);
  }
}

function init(): void {
  log("info", "renderer init started");

  const el = document.getElementById("nikxel-canvas") as HTMLCanvasElement | null;
  if (!el) {
    log("error", "canvas element not found");
    return;
  }
  const canvas: HTMLCanvasElement = el;

  const stateMachine = new StateMachine();
  const renderer = new SpriteRenderer(canvas, stateMachine);

  let pageantAnimId: ReturnType<typeof requestAnimationFrame> | null = null;
  let pageantActive = false;
  let pageantTargetX = 0;
  let pageantTargetY = 0;

  async function loadSprite(): Promise<void> {
    if (!window.nikxelAPI) return;

    window.nikxelAPI.onSpriteProcessed((success, dataUrl) => {
      if (success && dataUrl) {
        log("info", "sprite processed, loading");
        const img = new Image();
        img.onload = () => {
          log("info", "processed sprite image loaded");
          renderer.setSpriteSheet(img);
        };
        img.onerror = () => log("error", "failed to load processed sprite");
        img.src = dataUrl;
      }
    });

    window.nikxelAPI.onSpriteReset(async () => {
      log("info", "sprite reset triggered, loading default");
      const dataUrl = await window.nikxelAPI!.getDefaultSprite();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => renderer.setSpriteSheet(img);
        img.src = dataUrl;
      }
    });

    log("info", "requesting default sprite");
    const dataUrl = await window.nikxelAPI.getDefaultSprite();
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        log("info", "default sprite image loaded");
        renderer.setSpriteSheet(img);
      };
      img.onerror = () => log("error", "failed to load default sprite data URL");
      img.src = dataUrl;
    } else {
      log("warn", "no default sprite returned from main");
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
    try {
      const rect = canvas.getBoundingClientRect();
      if (rect.width !== VIEW_WIDTH || rect.height !== VIEW_HEIGHT) {
        renderer.resize(VIEW_WIDTH, VIEW_HEIGHT);
      }
      renderer.tick();
    } catch (e) {
      log("error", `gameLoop error: ${e}`);
    }
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
      pickNewTarget();
    } else {
      const speed = 1.5;
      const nx = currentX + (dx / dist) * speed;
      const ny = currentY + (dy / dist) * speed;

      if (stateMachine.state !== NikxelState.walk) {
        stateMachine.setState(NikxelState.walk);
      }

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

    if (Math.random() < 0.4) {
      setTimeout(() => {
        if (pageantActive) stateMachine.triggerPounce();
      }, 800);
    }

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

  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  loadSprite();
  setupIPCListeners();

  setupDrag(canvas, stateMachine, renderer);
  setupClickThrough(canvas);

  renderer.triggerPuff();

  gameLoop();

  document.addEventListener("mousemove", (e) => {
    renderer.setMousePosition(e.screenX, e.screenY);
  });

  log("info", "renderer init complete");
}

try {
  init();
} catch (e) {
  log("error", `init error: ${e instanceof Error ? `${e.message}\n${e.stack}` : e}`);
}
