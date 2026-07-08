export enum NikxelState {
  idle = "idle",
  walk = "walk",
  typing = "typing",
  thinking = "thinking",
  done = "done",
  dragging = "dragging",
  pounce = "pounce",
  petted = "petted",
  alert = "alert",
  recording = "recording",
  momReady = "momReady",
  writingMOM = "writingMOM",
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: number;
  link: string;
}

export interface IPCChannels {
  "keystroke": () => void;
  "keystroke-detected": () => void;
  "move-window": (x: number, y: number) => void;
  "begin-drag": () => void;
  "end-drag": () => void;
  "set-ignore-mouse-events": (ignore: boolean) => void;
  "calendar-credentials-ready": () => void;
  "calendar-events": (events: CalendarEvent[]) => void;
  "connect-calendar": () => void;
  "calendar-status": () => string;
  "process-sprite": (filePath: string) => void;
  "use-custom-sprite": (filePath: string) => void;
  "sprite-processed": (success: boolean, path?: string) => void;
  "reset-sprite": () => void;
  "sprite-reset": () => void;
  "get-app-data-path": () => string;
  "open-external": (url: string) => void;
  "window-position-changed": (x: number, y: number) => void;
}

export interface AppConfig {
  windowX?: number;
  windowY?: number;
  customSpritePath?: string;
  calendarConnected: boolean;
  startWithWindows: boolean;
  pageantMode: boolean;
}
