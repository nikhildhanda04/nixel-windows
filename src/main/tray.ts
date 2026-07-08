import { Tray, Menu, nativeImage, app, shell, dialog } from "electron";
import path from "path";
import fs from "fs";
import { getMainWindow, setWindowIgnoreMouse } from "./window";
import { configPath, spritePath, defaultSpritePath, googleCredsPath } from "./paths";
import { readConfig, saveConfig } from "./ipc-handlers";

let tray: Tray | null = null;

export function createTray(): Tray {
  const iconPath = path.join(__dirname, "..", "..", "assets", "icon.ico");
  let icon: Electron.NativeImage;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Nikxel");

  updateTrayMenu();
  return tray;
}

function updateTrayMenu(): void {
  if (!tray) return;

  const config = readConfig();
  const customSprite = config.customSpritePath && fs.existsSync(config.customSpritePath);
  const googleConnected = config.calendarConnected && fs.existsSync(googleCredsPath());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Start Pageant Mode",
      click: () => {
        const win = getMainWindow();
        if (win) win.webContents.send("pageant-start");
      },
    },
    {
      label: "Pause (hide character)",
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.hide();
          setWindowIgnoreMouse(true);
        }
      },
    },
    {
      label: "Show character",
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          setWindowIgnoreMouse(true);
        }
      },
    },
    { type: "separator" },
    {
      label: googleConnected ? "Calendar: Connected ✓" : "Calendar: Not connected",
      enabled: !googleConnected,
      click: () => {
        const win = getMainWindow();
        if (win) {
          if (fs.existsSync(googleCredsPath())) {
            win.webContents.send("connect-calendar");
          } else {
            const result = dialog.showMessageBoxSync({
              type: "info",
              title: "Google Calendar Setup",
              message: "Place google_creds.json in %APPDATA%/nikxel/ first, then try again.",
              buttons: ["OK"],
            });
          }
        }
      },
    },
    {
      label: "Connect Google Calendar...",
      click: () => {
        const win = getMainWindow();
        if (win) win.webContents.send("connect-calendar");
      },
    },
    { type: "separator" },
    {
      label: customSprite ? "Sprite: Custom" : "Sprite: Default",
      enabled: false,
    },
    {
      label: "Use Custom Sprite...",
      click: async () => {
        const result = await dialog.showOpenDialog({
          filters: [{ name: "PNG Images", extensions: ["png"] }],
          properties: ["openFile"],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          const win = getMainWindow();
          if (win) win.webContents.send("use-custom-sprite", result.filePaths[0]);
        }
      },
    },
    {
      label: "Process Sprite Sheet...",
      click: async () => {
        const result = await dialog.showOpenDialog({
          filters: [{ name: "PNG Images", extensions: ["png"] }],
          properties: ["openFile"],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          const win = getMainWindow();
          if (win) win.webContents.send("process-sprite", result.filePaths[0]);
        }
      },
    },
    {
      label: "Generate New Sprite...",
      click: () => {
        const promptPath = path.join(__dirname, "..", "..", "assets", "sprite_prompt.txt");
        if (fs.existsSync(promptPath)) {
          shell.openPath(promptPath);
        }
        shell.openExternal("https://gemini.google.com");
      },
    },
    {
      label: "Reset to Default Sprite",
      enabled: !!customSprite,
      click: () => {
        const win = getMainWindow();
        if (win) win.webContents.send("reset-sprite");
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => {
        shell.openExternal("https://github.com/nikxel/nikxel-windows/releases");
      },
    },
    {
      label: "Quit Nikxel",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

export function refreshTrayMenu(): void {
  updateTrayMenu();
}
