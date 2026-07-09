import { app } from "electron";
import { createMainWindow, getMainWindow } from "./window";
import { createTray } from "./tray";
import { setupIPCHandlers, readConfig, saveConfig } from "./ipc-handlers";
import { startKeyboardHook, stopKeyboardHook } from "./keyboard";
import { stopCalendar } from "./calendar";
import { appDataDir } from "./paths";
import fs from "fs";
import path from "path";

function log(level: string, message: string): void {
  try {
    const logPath = path.join(appDataDir(), "app.log");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] [${level}] ${message}\n`);
  } catch {
    // Can't log if logging fails
  }
}

app.whenReady().then(() => {
  log("info", "app started");
  const config = readConfig();
  const mainWindow = createMainWindow();

  if (config.windowX !== undefined && config.windowY !== undefined) {
    mainWindow.setPosition(config.windowX, config.windowY);
  }

  mainWindow.on("moved", () => {
    const [x, y] = mainWindow.getPosition();
    saveConfig({ windowX: x, windowY: y });
  });

  createTray();
  setupIPCHandlers(mainWindow);
});

app.on("window-all-closed", () => {
  // Don't quit on window close — keep running in tray
});

app.on("before-quit", () => {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    const [x, y] = win.getPosition();
    saveConfig({ windowX: x, windowY: y });
  }
  stopKeyboardHook();
  stopCalendar();
});

app.on("activate", () => {
  // macOS focus behavior — no-op on Windows
});
