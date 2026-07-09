export {};

declare global {
interface Window {
  nikxelAPI: {
    onKeystroke: (callback: () => void) => () => void;
    onCalendarEvents: (callback: (events: any[]) => void) => () => void;
    onPageantStart: (callback: () => void) => () => void;
    moveWindow: (x: number, y: number) => void;
    processSprite: (filePath: string) => void;
    useCustomSprite: (filePath: string) => void;
    resetSprite: () => void;
    onSpriteProcessed: (callback: (success: boolean, path?: string) => void) => () => void;
    onSpriteReset: (callback: () => void) => () => void;
    connectCalendar: () => void;
    getCalendarStatus: () => Promise<string>;
    openExternal: (url: string) => void;
    onDefaultSprite: (callback: (dataUrl: string) => void) => () => void;
    onConfig: (callback: (config: any) => void) => () => void;
    saveConfig: (updates: any) => void;
  };
}
}
