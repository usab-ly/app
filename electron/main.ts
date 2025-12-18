import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';
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
    vibrancy: 'under-window', // macOS blur effect
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false, // We're using BrowserView instead
    },
  });

  // Load the Next.js app
  mainWindow.loadURL(NEXT_URL);

  // Create BrowserView for the web content
  browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setBrowserView(browserView);

  // Initial positioning (320px sidebar width on right side)
  updateBrowserViewBounds();

  // Load initial page
  browserView.webContents.loadURL('https://www.google.com');

  // Inject fake cursor when page loads
  browserView.webContents.on('did-finish-load', () => {
    injectFakeCursor();
  });

  // Handle navigation to re-inject cursor
  browserView.webContents.on('did-navigate', () => {
    injectFakeCursor();
  });

  // Handle window resize
  mainWindow.on('resize', () => {
    updateBrowserViewBounds();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    browserView = null;
  });
}

function updateBrowserViewBounds() {
  if (!mainWindow || !browserView) return;

  const bounds = mainWindow.getBounds();
  const TITLEBAR_HEIGHT = 52; // Custom title bar height
  const SIDEBAR_WIDTH = 320; // Sidebar width on right
  const RIGHT_MARGIN = isHudVisible ? SIDEBAR_WIDTH : 0; // Dynamic based on HUD visibility

  browserView.setBounds({
    x: 0,
    y: TITLEBAR_HEIGHT,
    width: bounds.width - RIGHT_MARGIN,
    height: bounds.height - TITLEBAR_HEIGHT,
  });
}

function injectFakeCursor() {
  if (!browserView) return;

  // Inject CSS for fake cursor
  browserView.webContents.insertCSS(`
    #fake-cursor {
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.6);
      border: 2px solid rgba(59, 130, 246, 1);
      pointer-events: none;
      z-index: 999999;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      transition: all 0.1s ease;
    }
    #fake-cursor.clicking {
      transform: translate(-50%, -50%) scale(0.8);
      background: rgba(59, 130, 246, 0.9);
    }
  `);

  // Inject JavaScript for fake cursor functionality
  browserView.webContents.executeJavaScript(`
    (function() {
      // Remove existing cursor if any
      const existing = document.getElementById('fake-cursor');
      if (existing) existing.remove();

      // Create fake cursor element
      const cursor = document.createElement('div');
      cursor.id = 'fake-cursor';
      document.body.appendChild(cursor);

      // Function to simulate real mouse click with all events
      function simulateClick(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        const options = {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          button: 0,
          buttons: 1
        };

        // Simulate complete mouse event sequence
        element.dispatchEvent(new MouseEvent('mouseover', options));
        element.dispatchEvent(new MouseEvent('mouseenter', options));
        element.dispatchEvent(new MouseEvent('mousemove', options));
        element.dispatchEvent(new MouseEvent('mousedown', options));
        element.dispatchEvent(new MouseEvent('mouseup', options));
        element.dispatchEvent(new MouseEvent('click', options));
        
        // Also try the native click as fallback
        element.click();
      }

      // Listen for Tab key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          
          // Add clicking animation
          cursor.classList.add('clicking');
          
          // Click at the center of the viewport
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          // Simulate click with full mouse event sequence
          simulateClick(centerX, centerY);
          
          // Remove clicking animation
          setTimeout(() => {
            cursor.classList.remove('clicking');
          }, 150);
        }
      });
    })();
  `);
}

// IPC Handler: Set URL in BrowserView
ipcMain.handle('set-url', async (_event, url: string) => {
  if (!browserView)
    return { success: false, error: 'BrowserView not initialized' };

  try {
    // Validate URL
    const validUrl = new URL(url);
    await browserView.webContents.loadURL(validUrl.toString());
    return { success: true, url: validUrl.toString() };
  } catch (error) {
    console.error('Invalid URL:', error);
    return { success: false, error: 'Invalid URL' };
  }
});

// IPC Handler: Get current URL
ipcMain.handle('get-url', async () => {
  if (!browserView) return null;
  return browserView.webContents.getURL();
});

// IPC Handler: Toggle HUD visibility
ipcMain.handle('toggle-hud', async () => {
  isHudVisible = !isHudVisible;
  updateBrowserViewBounds();
  return { hudVisible: isHudVisible };
});

// IPC Handler: Get HUD visibility state
ipcMain.handle('get-hud-state', async () => {
  return { hudVisible: isHudVisible };
});

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
