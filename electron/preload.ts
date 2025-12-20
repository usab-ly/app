import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  setUrl: (
    url: string
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    return ipcRenderer.invoke('set-url', url);
  },
  getUrl: (): Promise<string | null> => {
    return ipcRenderer.invoke('get-url');
  },
  toggleHud: (): Promise<{ hudVisible: boolean }> => {
    return ipcRenderer.invoke('toggle-hud');
  },
  getHudState: (): Promise<{ hudVisible: boolean }> => {
    return ipcRenderer.invoke('get-hud-state');
  },
});

contextBridge.exposeInMainWorld('electron', {
  on: (channel: string, callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on(channel, subscription);
    return subscription;
  },
  removeListener: (channel: string, subscription: any) => {
    ipcRenderer.removeListener(channel, subscription);
  },
});
