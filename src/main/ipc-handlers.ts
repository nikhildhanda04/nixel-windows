import { ipcMain, shell, BrowserWindow } from "electron";
import fs from "fs";
import path from "path";
import { configPath, spritePath, defaultSpritePath, googleCredsPath } from "./paths";
import { AppConfig } from "../shared/types";
import { moveWindow, setWindowIgnoreMouse } from "./window";
import { refreshTrayMenu } from "./tray";
import { startCalendar, stopCalendar } from "./calendar";
import { startKeyboardHook, stopKeyboardHook } from "./keyboard";
import { processSpriteSheet } from "./sprite-processor";

let config: AppConfig = {
  calendarConnected: false,
  startWithWindows: true,
  pageantMode: true,
};

export function readConfig(): AppConfig {
  try {
    if (fs.existsSync(configPath())) {
      const data = fs.readFileSync(configPath(), "utf-8");
      config = { ...config, ...JSON.parse(data) };
    }
  } catch {
    // use defaults
  }
  return config;
}

export function saveConfig(updates: Partial<AppConfig>): void {
  config = { ...config, ...updates };
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2));
}

export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  // Window movement
  ipcMain.on("move-window", (_event, x: number, y: number) => {
    moveWindow(x, y);
  });

  ipcMain.on("set-ignore-mouse-events", (_event, ignore: boolean) => {
    setWindowIgnoreMouse(ignore);
  });

  // Keyboard — keystrokes from uiohook → renderer
  ipcMain.on("keystroke-detected", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("keystroke");
    }
  });

  // Calendar
  ipcMain.on("connect-calendar", () => {
    startCalendar(mainWindow);
  });

  ipcMain.handle("calendar-status", () => {
    const connected = fs.existsSync(googleCredsPath()) && config.calendarConnected;
    return connected ? "connected" : "disconnected";
  });

  // Sprite management
  ipcMain.on("use-custom-sprite", (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        const dest = spritePath();
        fs.copyFileSync(filePath, dest);
        config.customSpritePath = dest;
        saveConfig({ customSpritePath: dest });
        mainWindow.webContents.send("sprite-processed", true, dest);
        refreshTrayMenu();
      }
    } catch (e) {
      mainWindow.webContents.send("sprite-processed", false);
    }
  });

  ipcMain.on("process-sprite", async (_event, filePath: string) => {
    try {
      const dest = await processSpriteSheet(filePath);
      config.customSpritePath = dest;
      saveConfig({ customSpritePath: dest });
      mainWindow.webContents.send("sprite-processed", true, dest);
      refreshTrayMenu();
    } catch (e) {
      mainWindow.webContents.send("sprite-processed", false);
    }
  });

  ipcMain.on("reset-sprite", () => {
    try {
      const dest = spritePath();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      config.customSpritePath = undefined;
      saveConfig({ customSpritePath: undefined });
      // Send default sprite again
      const defPath = defaultSpritePath();
      if (fs.existsSync(defPath)) {
        const data = fs.readFileSync(defPath);
        const base64 = data.toString("base64");
        mainWindow.webContents.send("default-sprite", `data:image/png;base64,${base64}`);
      }
      mainWindow.webContents.send("sprite-reset");
      refreshTrayMenu();
    } catch (e) {
      // ignore
    }
  });

  // Config
  ipcMain.on("save-config", (_event, updates: Partial<AppConfig>) => {
    saveConfig(updates);
  });

  // Pageant mode
  ipcMain.on("pageant-start", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("pageant-start");
    }
  });

  // External links
  ipcMain.on("open-external", (_event, url: string) => {
    shell.openExternal(url);
  });

  // Start keyboard hook and calendar when renderer is ready
  mainWindow.webContents.on("did-finish-load", () => {
    const cfg = readConfig();
    mainWindow.webContents.send("config", cfg);

    // Send default sprite as base64 data URL (handles ASAR vs extraResources)
    const defPath = defaultSpritePath();
    if (fs.existsSync(defPath)) {
      const data = fs.readFileSync(defPath);
      const base64 = data.toString("base64");
      mainWindow.webContents.send("default-sprite", `data:image/png;base64,${base64}`);
    }

    startKeyboardHook(mainWindow);

    if (cfg.calendarConnected && fs.existsSync(googleCredsPath())) {
      startCalendar(mainWindow);
    }
  });
}
