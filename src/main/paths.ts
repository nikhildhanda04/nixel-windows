import path from "path";
import fs from "fs";
import { app } from "electron";

export function appDataDir(): string {
  const appdata = process.env.APPDATA || path.join(process.env.USERPROFILE || "~", "AppData", "Roaming");
  const dir = path.join(appdata, "nikxel");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function configPath(): string {
  return path.join(appDataDir(), "config.json");
}

export function spritePath(): string {
  return path.join(appDataDir(), "sprites.png");
}

export function defaultSpritePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", "sprites.png");
  }
  return path.join(__dirname, "..", "..", "assets", "sprites.png");
}

export function googleCredsPath(): string {
  return path.join(appDataDir(), "google_creds.json");
}

export function googleTokenPath(): string {
  return path.join(appDataDir(), "google_token.json");
}

export function promptsDir(): string {
  const dir = path.join(appDataDir(), "prompts");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
