import { NikxelState } from "../../shared/types";
import {
  FRAME_SIZE,
  FRAMES_PER_ROW,
  CHAR_SIZE,
  HALF_CHAR,
  SPRING_DURATION,
  PUFF_DURATION,
  PUFF_REVEAL_AT,
  OVERHEAT_WPM,
  WPM_WINDOW_SEC,
  stateRowMap,
  stateFPS,
  stateFrameCount,
} from "../../shared/constants";
import { StateMachine } from "./state-machine";
import { computeStateTransforms, easeOutBounce } from "./transforms";
import { drawDropShadow } from "./effects/drop-shadow";
import { drawOverheatTint, drawSteam, isOverheated } from "./effects/overheat";
import { drawThinkingDots } from "./effects/thinking-dots";
import { PuffState, startPuff, drawPixelPuff } from "./effects/pixel-dust";
import { drawSparkle, drawRecordingIndicator } from "./effects/sparkle";
import {
  CalendarBubble,
  ReminderBubble,
  updateBubbleFade,
  drawCalendarBubble,
  drawReminderBubbles,
} from "./effects/bubbles";

export class SpriteRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stateMachine: StateMachine;

  private spriteSheet: HTMLImageElement | null = null;
  private spriteLoaded = false;

  private state: NikxelState = NikxelState.idle;
  private facingRight = true;
  private frameIndex = 0;
  private frameElapsed = 0;
  private lastTick = 0;

  private bounce = 0;
  private wiggle = 0;
  private scale = 1;

  // Spring-back
  private springActive = false;
  private springStart = 0;

  // Drag inertia
  dragLagX = 0;
  dragLagY = 0;

  // Overheat
  private keyTimestamps: number[] = [];

  // Puff
  puff: PuffState = { active: false, startTime: 0, avatarHidden: false };

  // Bubbles
  private bubbleOpacity = 0;
  private bubbleTargetOpacity = 0;
  private bubbleScale = 1;

  // Recording
  recordingStartTime: number = 0;

  // Calendar
  calendarBubble: CalendarBubble | null = null;

  // Reminders
  reminderBubbles: ReminderBubble[] = [];

  // Mouse tracking
  private mouseX = 0;
  private mouseY = 0;

  constructor(canvas: HTMLCanvasElement, stateMachine: StateMachine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.stateMachine = stateMachine;

    this.ctx.imageSmoothingEnabled = false;

    stateMachine.setStateChangeCallback((s) => {
      this.state = s;
      this.frameIndex = 0;
      this.frameElapsed = 0;
    });

    stateMachine.setFacingChangeCallback((f) => {
      this.facingRight = f;
    });
  }

  setSpriteSheet(img: HTMLImageElement): void {
    this.spriteSheet = img;
    this.spriteLoaded = true;
  }

  isSpriteLoaded(): boolean {
    return this.spriteLoaded;
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  recordKeystroke(): void {
    this.keyTimestamps.push(performance.now() / 1000);
  }

  triggerSpringBack(): void {
    this.springActive = true;
    this.springStart = performance.now() / 1000;
  }

  triggerPuff(): void {
    startPuff(this.puff);
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  private stateRow(): number {
    return stateRowMap[this.state] ?? 0;
  }

  tick(): void {
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastTick, 0.1);
    this.lastTick = now;

    // Overheat decay
    this.keyTimestamps = this.keyTimestamps.filter(
      (ts) => now - ts < WPM_WINDOW_SEC
    );

    // Frame animation
    const fps = stateFPS[this.state] ?? 3;
    const mf = stateFrameCount[this.state] ?? 4;
    if (fps > 0 && this.spriteLoaded) {
      this.frameElapsed += dt;
      const interval = 1.0 / fps;
      while (this.frameElapsed >= interval) {
        this.frameElapsed -= interval;
        this.frameIndex = (this.frameIndex + 1) % mf;
      }
    }

    // Transform animation
    const transforms = computeStateTransforms(
      this.state,
      now,
      this.dragLagX,
      this.dragLagY
    );
    this.bounce = transforms.bounce;
    this.wiggle = transforms.wiggle;
    this.scale = transforms.scale;

    // Spring-back
    if (this.springActive) {
      const elapsed = now - this.springStart;
      const progress = elapsed / SPRING_DURATION;
      if (progress >= 1.0) {
        this.springActive = false;
      } else {
        this.scale = 1.2 + easeOutBounce(progress) * (1.0 - 1.2);
      }
    }

    // Bubble fade
    const shouldShowBubbles = this.state === NikxelState.thinking;
    this.bubbleTargetOpacity = shouldShowBubbles ? 1 : 0;
    const fadeSpeed = 6.0;
    if (this.bubbleTargetOpacity > this.bubbleOpacity) {
      this.bubbleOpacity = Math.min(1, this.bubbleOpacity + dt * fadeSpeed);
      const p = this.bubbleOpacity;
      this.bubbleScale = 0.8 + 0.2 * p + 0.15 * Math.sin(p * Math.PI) * (1 - p);
    } else {
      this.bubbleOpacity = Math.max(0, this.bubbleOpacity - dt * fadeSpeed);
      this.bubbleScale = this.bubbleOpacity;
    }

    // Calendar bubble fade
    if (this.calendarBubble) {
      updateBubbleFade(this.calendarBubble, dt);
    }

    // Reminder bubble lifetime
    if (this.reminderBubbles.length > 0) {
      this.reminderBubbles = this.reminderBubbles.filter(
        (b) => now - b.addedAt < 30
      );
    }

    // Update mouse facing if not dragging
    if (this.state !== NikxelState.dragging) {
      const rect = this.canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      this.stateMachine.updateMouse(this.mouseX, cx);
    }

    this.draw();
  }

  draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const isDragging = this.state === NikxelState.dragging;

    // 1. Drop shadow
    drawDropShadow(ctx, cx, cy, HALF_CHAR, this.bounce, isDragging);

    // 2. Character sprite
    if (!this.puff.avatarHidden) {
      if (this.spriteLoaded && this.spriteSheet) {
        ctx.save();
        ctx.translate(cx + this.wiggle, cy + this.bounce);
        ctx.scale(this.facingRight ? this.scale : -this.scale, this.scale);
        ctx.translate(-HALF_CHAR, -HALF_CHAR);

        const mf = isDragging ? 1 : (stateFrameCount[this.state] ?? 4);
        const col = this.frameIndex % mf;
        const row = this.stateRow();
        const sx = col * FRAME_SIZE;
        const sy = row * FRAME_SIZE;

        ctx.drawImage(
          this.spriteSheet,
          sx,
          sy,
          FRAME_SIZE,
          FRAME_SIZE,
          0,
          0,
          CHAR_SIZE,
          CHAR_SIZE
        );

        ctx.restore();
      } else {
        // Fallback — pink square
        ctx.save();
        ctx.translate(cx + this.wiggle, cy + this.bounce);
        ctx.scale(this.facingRight ? this.scale : -this.scale, this.scale);
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(-HALF_CHAR, -HALF_CHAR, CHAR_SIZE, CHAR_SIZE);
        ctx.restore();
      }
    }

    // 3. Pixel dust puff
    drawPixelPuff(
      ctx,
      cx,
      cy,
      this.puff,
      PUFF_DURATION,
      PUFF_REVEAL_AT,
      () => this.triggerSpringBack()
    );

    // 4. Overheat
    if (!isDragging) {
      const { isHot, wpm } = isOverheated(
        this.keyTimestamps,
        WPM_WINDOW_SEC,
        OVERHEAT_WPM
      );
      if (isHot) {
        const intensity = Math.min(1, (wpm - OVERHEAT_WPM) / 30);
        drawOverheatTint(
          ctx,
          cx,
          cy,
          HALF_CHAR,
          CHAR_SIZE,
          this.wiggle,
          this.bounce,
          intensity
        );
        drawSteam(ctx, cx, cy, HALF_CHAR);
      }
    }

    // 5. Recording indicator
    if (this.state === NikxelState.recording && this.recordingStartTime > 0) {
      drawRecordingIndicator(
        ctx,
        cx,
        cy,
        HALF_CHAR,
        this.recordingStartTime
      );
    }

    // 6. MOM sparkle
    if (this.state === NikxelState.momReady) {
      drawSparkle(ctx, cx, cy, 5);
    }

    // 7. Thinking dots
    if (this.state === NikxelState.thinking) {
      drawThinkingDots(
        ctx,
        cx,
        cy,
        HALF_CHAR,
        this.frameIndex,
        this.bubbleOpacity
      );
    }

    // 8. Calendar bubble
    if (this.calendarBubble && this.calendarBubble.opacity > 0.01) {
      drawCalendarBubble(
        ctx,
        cx,
        cy,
        HALF_CHAR,
        this.calendarBubble.title,
        this.calendarBubble.opacity
      );
    }

    // 9. Reminder bubbles
    if (this.reminderBubbles.length > 0) {
      drawReminderBubbles(ctx, cx, cy, HALF_CHAR, this.reminderBubbles);
    }
  }
}
