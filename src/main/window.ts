import { BrowserWindow, screen } from "electron";
import path from "path";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../shared/constants";

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    x: Math.round((screenW - VIEW_WIDTH) / 2),
    y: Math.round((screenH - VIEW_HEIGHT) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    type: "toolbar",
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);

  const htmlPath = path.join(__dirname, "..", "renderer", "index.html");
  win.loadFile(htmlPath);

  win.on("closed", () => {
    mainWindow = null;
  });

  mainWindow = win;
  return win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setWindowIgnoreMouse(_ignore: boolean): void {
  // No-op: click-through handled by CSS pointer-events on body vs canvas
}

export function moveWindow(x: number, y: number): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const bounds = screen.getPrimaryDisplay().workArea;
    const [w, h] = mainWindow.getSize();
    const clampedX = Math.round(Math.max(0, Math.min(x, bounds.width - w)));
    const clampedY = Math.round(Math.max(0, Math.min(y, bounds.height - h)));
    mainWindow.setPosition(clampedX, clampedY);
  }
}
