import {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  globalShortcut,
} from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let browserView: BrowserView | null = null;
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
    frame: false, // Frameless window for custom title bar
    transparent: true, // Enable transparency for rounded corners
    titleBarStyle: 'hiddenInset', // macOS traffic lights
    trafficLightPosition: { x: 16, y: 16 }, // Position traffic lights
    vibrancy: 'sidebar', // macOS blur effect
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable webview tag
    },
    backgroundMaterial: 'acrylic',
    roundedCorners: true,
  });

  // Load the Next.js app
  mainWindow.loadURL(NEXT_URL);

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
    if (ret) {
      console.log('Shortcut registered');
    }
  };

  const unregisterShortcut = () => {
    globalShortcut.unregister('CommandOrControl+S');
    console.log('Shortcut unregistered');
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
app.whenReady().then(() => {
  createWindow();

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
