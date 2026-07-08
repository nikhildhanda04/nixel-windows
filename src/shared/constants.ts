export const FRAME_SIZE = 64;
export const FRAMES_PER_ROW = 4;
export const TOTAL_ROWS = 10;
export const SHEET_WIDTH = 256;
export const SHEET_HEIGHT = 640;

export const CHAR_SIZE = 156;
export const HALF_CHAR = 78;
export const VIEW_WIDTH = 340;
export const VIEW_HEIGHT = 440;

export const OVERHEAT_WPM = 30;
export const WPM_WINDOW_SEC = 5.0;
export const KEYS_PER_WORD = 12.0;

export const SPRING_DURATION = 0.45;
export const PUFF_DURATION = 1.3;
export const PUFF_REVEAL_AT = 0.54;

export const DRAG_LAG_X_MAX = 18;
export const DRAG_LAG_Y_MAX = 12;

export const stateRowMap: Record<string, number> = {
  idle: 0,
  walk: 0,
  typing: 1,
  writingMOM: 1,
  thinking: 2,
  done: 3,
  dragging: 4,
  pounce: 5,
  petted: 6,
  alert: 7,
  recording: 8,
  momReady: 9,
};

export const stateFPS: Record<string, number> = {
  idle: 3,
  walk: 8,
  typing: 8,
  thinking: 2.5,
  done: 6,
  dragging: 0,
  pounce: 8,
  petted: 3,
  alert: 6,
  recording: 4,
  momReady: 6,
  writingMOM: 8,
};

export const stateFrameCount: Record<string, number> = {
  idle: 4,
  walk: 4,
  typing: 4,
  thinking: 4,
  done: 4,
  dragging: 1,
  pounce: 4,
  petted: 4,
  alert: 4,
  recording: 4,
  momReady: 4,
  writingMOM: 4,
};

export const stateAutoReturn: Record<string, number | null> = {
  idle: null,
  walk: null,
  typing: 0.2,
  thinking: null,
  done: 1.5,
  dragging: null,
  pounce: 0.7,
  petted: 2.5,
  alert: 2.0,
  recording: null,
  momReady: 2.0,
  writingMOM: null,
};

export const CALENDAR_POLL_INTERVAL = 30000;
export const CALENDAR_LOOKAHEAD_MIN = 2;
export const CALENDAR_BUBBLE_DURATION = 10000;

export const BUBBLE_FADE_SPEED = 5.0;
export const BUBBLE_FADE_IN = 0.3;
export const BUBBLE_FADE_OUT = 0.4;
export const REMINDER_LIFETIME = 30;
