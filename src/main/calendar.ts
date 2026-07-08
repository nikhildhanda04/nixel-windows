import { BrowserWindow, shell } from "electron";
import http from "http";
import url from "url";
import fs from "fs";
import { google } from "googleapis";
import { googleCredsPath, googleTokenPath } from "./paths";
import { CALENDAR_POLL_INTERVAL, CALENDAR_LOOKAHEAD_MIN } from "../shared/constants";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

let calendarInterval: ReturnType<typeof setInterval> | null = null;
let authClient: any = null;

function getOAuth2Client() {
  if (!fs.existsSync(googleCredsPath())) return null;

  const creds = JSON.parse(fs.readFileSync(googleCredsPath(), "utf-8"));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://127.0.0.1:8387/oauth2callback"
  );

  if (fs.existsSync(googleTokenPath())) {
    const token = JSON.parse(fs.readFileSync(googleTokenPath(), "utf-8"));
    oauth2Client.setCredentials(token);
  }

  oauth2Client.on("tokens", (tokens: any) => {
    if (tokens.refresh_token) {
      const existingToken = fs.existsSync(googleTokenPath())
        ? JSON.parse(fs.readFileSync(googleTokenPath(), "utf-8"))
        : {};
      fs.writeFileSync(
        googleTokenPath(),
        JSON.stringify({ ...existingToken, ...tokens }, null, 2)
      );
    }
  });

  return oauth2Client;
}

async function pollCalendar(mainWindow: BrowserWindow): Promise<void> {
  if (!authClient) return;

  try {
    const calendar = google.calendar({ version: "v3", auth: authClient });
    const now = new Date();
    const lookAhead = new Date(now.getTime() + CALENDAR_LOOKAHEAD_MIN * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: lookAhead.toISOString(),
      maxResults: 3,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || "(No title)",
      startTime: new Date(event.start?.dateTime || event.start?.date).getTime(),
      link: event.htmlLink || "",
    }));

    if (events.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("calendar-events", events);
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      // Token expired, re-auth
      startCalendar(mainWindow);
    }
  }
}

export function startCalendar(mainWindow: BrowserWindow): void {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return;

  // Check if we need to authorize
  const tokenExists = fs.existsSync(googleTokenPath());
  if (!tokenExists) {
    runOAuthFlow(oauth2Client, mainWindow);
    return;
  }

  authClient = oauth2Client;

  if (calendarInterval) clearInterval(calendarInterval);
  pollCalendar(mainWindow);
  calendarInterval = setInterval(() => pollCalendar(mainWindow), CALENDAR_POLL_INTERVAL);
}

function runOAuthFlow(oauth2Client: any, mainWindow: BrowserWindow): void {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || "", true);

    if (parsedUrl.pathname === "/oauth2callback") {
      const code = parsedUrl.query.code as string;
      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          fs.writeFileSync(googleTokenPath(), JSON.stringify(tokens, null, 2));
          authClient = oauth2Client;

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Nikxel Calendar Connected!</h1><p>You can close this window.</p></body></html>");

          if (calendarInterval) clearInterval(calendarInterval);
          pollCalendar(mainWindow);
          calendarInterval = setInterval(() => pollCalendar(mainWindow), CALENDAR_POLL_INTERVAL);
        } catch (err) {
          res.writeHead(500);
          res.end("Auth failed");
        }
      } else {
        res.writeHead(400);
        res.end("No code received");
      }
      server.close();
    }
  });

  server.listen(8387, () => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

    shell.openExternal(authUrl);
  });
}

export function stopCalendar(): void {
  if (calendarInterval) {
    clearInterval(calendarInterval);
    calendarInterval = null;
  }
}
