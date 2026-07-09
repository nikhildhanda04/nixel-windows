import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("nikxelAPI", {
  // From main -> renderer (keystroke events)
  onKeystroke: (callback: () => void) => {
    ipcRenderer.on("keystroke", () => callback());
    return () => ipcRenderer.removeAllListeners("keystroke");
  },

  // From main -> renderer (calendar events)
  onCalendarEvents: (callback: (events: any[]) => void) => {
    ipcRenderer.on("calendar-events", (_: IpcRendererEvent, events: any[]) => callback(events));
    return () => ipcRenderer.removeAllListeners("calendar-events");
  },

  // From main -> renderer (pageant mode)
  onPageantStart: (callback: () => void) => {
    ipcRenderer.on("pageant-start", () => callback());
    return () => ipcRenderer.removeAllListeners("pageant-start");
  },

  // Window movement
  moveWindow: (x: number, y: number) => {
    ipcRenderer.send("move-window", x, y);
  },

  // Sprite management
  processSprite: (filePath: string) => {
    ipcRenderer.send("process-sprite", filePath);
  },
  useCustomSprite: (filePath: string) => {
    ipcRenderer.send("use-custom-sprite", filePath);
  },
  resetSprite: () => {
    ipcRenderer.send("reset-sprite");
  },
  onSpriteProcessed: (callback: (success: boolean, path?: string) => void) => {
    ipcRenderer.on("sprite-processed", (_: IpcRendererEvent, success: boolean, path?: string) => callback(success, path));
    return () => ipcRenderer.removeAllListeners("sprite-processed");
  },
  onSpriteReset: (callback: () => void) => {
    ipcRenderer.on("sprite-reset", () => callback());
    return () => ipcRenderer.removeAllListeners("sprite-reset");
  },

  // Calendar
  connectCalendar: () => {
    ipcRenderer.send("connect-calendar");
  },
  getCalendarStatus: () => {
    return ipcRenderer.invoke("calendar-status");
  },

  // Utilities
  openExternal: (url: string) => {
    ipcRenderer.send("open-external", url);
  },

  // Default sprite (request-based, no race condition on initial load)
  getDefaultSprite: () => {
    return ipcRenderer.invoke("get-default-sprite");
  },

  // Config
  onConfig: (callback: (config: any) => void) => {
    ipcRenderer.on("config", (_: IpcRendererEvent, config: any) => callback(config));
    return () => ipcRenderer.removeAllListeners("config");
  },
  saveConfig: (updates: any) => {
    ipcRenderer.send("save-config", updates);
  },
});
