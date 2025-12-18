export {};

declare global {
  interface Window {
    api: {
      setUrl: (
        url: string
      ) => Promise<{ success: boolean; url?: string; error?: string }>;
      getUrl: () => Promise<string | null>;
      toggleHud: () => Promise<{ hudVisible: boolean }>;
      getHudState: () => Promise<{ hudVisible: boolean }>;
    };
  }
}
