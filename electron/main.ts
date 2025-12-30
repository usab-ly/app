import { app, BrowserWindow, ipcMain, globalShortcut, session } from 'electron';
import * as path from 'path';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch';

let mainWindow: BrowserWindow | null = null;
let isHudVisible = true;

const isDev = process.env.NODE_ENV !== 'production';
const NEXT_URL = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(__dirname, '../../.next/server/app/index.html')}`;

function createWindow() {
  // Create the browser window with custom title bar for macOS
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window',
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    backgroundMaterial: 'acrylic',
  });

  // Load the Next.js app
  mainWindow.loadURL(NEXT_URL + '/agent/');

  // Open DevTools in development
  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }

  // Register shortcut handler
  const registerShortcut = () => {
    const ret = globalShortcut.register('CommandOrControl+S', () => {
      if (mainWindow) {
        console.log('CommandOrControl+S is pressed');
        mainWindow.webContents.send('toggle-sidebar');
      }
    });
  };

  const unregisterShortcut = () => {
    globalShortcut.unregister('CommandOrControl+S');
  };

  // Register on focus, unregister on blur
  mainWindow.on('focus', registerShortcut);
  mainWindow.on('blur', unregisterShortcut);

  // Register initially since window starts focused
  registerShortcut();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createWindow2() {
  // Create the browser window with custom title bar for macOS
  let mainWindow2: BrowserWindow | null = new BrowserWindow({
    width: 850,
    maxWidth: 850,
    minWidth: 850,
    height: 550,
    maxHeight: 550,
    minHeight: 550,
    frame: false,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable webview tag
    },
    // backgroundMaterial: 'acrylic',
  });

  // Load the Next.js app
  mainWindow2.loadURL(NEXT_URL + '/welcome/');

  // Open DevTools in development
  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow2.on('closed', () => {
    mainWindow2 = null;
  });
}

// IPC Handler: Toggle HUD visibility
ipcMain.handle('toggle-hud', async () => {
  isHudVisible = !isHudVisible;
  return { hudVisible: isHudVisible };
});

// IPC Handler: Get HUD visibility state
ipcMain.handle('get-hud-state', async () => {
  return { hudVisible: isHudVisible };
});

app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal');

// App lifecycle
app.whenReady().then(async () => {
  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(session.defaultSession);
    console.log('AdBlocker enabled!');
  } catch (error) {
    console.error('Failed to enable AdBlocker:', error);
  }

  // createWindow();
  createWindow2();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});
