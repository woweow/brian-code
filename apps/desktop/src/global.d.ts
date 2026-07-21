export type DesktopApi = {
  runAgent: (prompt: string) => Promise<string>;
};

declare global {
  interface Window {
    api?: DesktopApi;
  }
}

export {};
