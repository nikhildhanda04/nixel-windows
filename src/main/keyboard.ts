import { BrowserWindow } from "electron";

let hookStarted = false;

export function startKeyboardHook(mainWindow: BrowserWindow): void {
  if (hookStarted) return;
  hookStarted = true;

  try {
    const uiohook = require("uiohook-napi");

    uiohook.on("keydown", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("keystroke");
      }
    });

    uiohook.start();
    console.log("[nikxel] Keyboard hook started");
  } catch (err) {
    console.log("[nikxel] uiohook-napi not available, falling back to no keyboard detection");
    hookStarted = false;
  }
}

export function stopKeyboardHook(): void {
  if (!hookStarted) return;
  try {
    const uiohook = require("uiohook-napi");
    uiohook.stop();
  } catch {
    // ignore
  }
  hookStarted = false;
}
