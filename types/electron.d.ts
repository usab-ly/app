export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          preload?: string;
          webpreferences?: string;
        },
        HTMLElement
      >;
    }
  }

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
