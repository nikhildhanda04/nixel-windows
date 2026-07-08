# Nixel (Nikxel for Windows)

A tiny pixel-art desktop companion that floats on your Windows desktop — watches your AI agents work, surfaces calendar events, and reacts to your typing and mouse.

Built with Electron + TypeScript.

## Download

Grab the latest installer from [Releases](https://github.com/nikhildhanda04/nixel-windows/releases).

## Quick Start

1. **Install** the `.exe` — Nikxel runs in the system tray
2. **Create your character** — see below
3. **Right-click the tray icon** → "Process Sprite Sheet..." → select your PNG
4. **Done** — your pixel companion appears on your desktop

## Create Your Own Character

You generate a custom pixel sprite sheet using Google Gemini (free, works in any browser — no install needed):

### Step 1 — Generate your pixel character

1. Open `sprite_prompt.txt` (included in the install)
2. Copy the **Step 1** prompt
3. Go to [Gemini](https://gemini.google.com), upload a selfie, paste the prompt
4. Download the result as `character.png`

### Step 2 — Generate the sprite sheet

1. From `sprite_prompt.txt`, copy the **Step 2** prompt
2. Upload your `character.png` to Gemini and paste the prompt
3. Download the result as `sprites.png` (256×640, 10 rows × 4 columns)
4. **Tray icon → Process Sprite Sheet...** → select your PNG

The app strips the magenta background and installs your character.

## Features

| Feature | How it works |
|---------|-------------|
| 🐱 Floats on desktop | Always-on-top transparent window |
| 🤔 Thinking mode | Watches AI agents (opencode, claude, cursor, codex, antigravity) |
| 🎉 Celebration jump | Agent completed a task |
| 🖱️ Draggable | Click + drag — stretches like mochi, springs back |
| ⌨️ Overheat | Turns red + steams when typing fast (>30 WPM) |
| 💭 Thinking dots | Animated "..." during agent processing |
| 🎪 Pageant mode | Auto-walks around the screen |
| 📅 Calendar pings | Google Calendar events shown as bubbles (optional) |

## Build from Source

```bash
npm install
npm run build
```

Output: `dist/Nikxel Setup 0.1.0.exe`

## Requirements

- Windows 10 or later
- 64-bit (ARM64 or x64)

## License

MIT
