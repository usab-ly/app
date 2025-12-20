'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useRef, useEffect } from 'react';
import { PanelLeft } from 'lucide-react';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('https://alg0run.netlify.app/');
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const webviewRef = useRef<any>(null);

  const handleNavigate = (url: string) => {
    setCurrentUrl(url);
    setCurrentFavicon(null); // Reset favicon on navigation
  };

  const handleBack = () => {
    if (webviewRef.current && webviewRef.current.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (webviewRef.current && webviewRef.current.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Listen for toggle-sidebar event from Electron
    const handleToggle = () => {
      setIsSidebarOpen((prev) => !prev);
    };

    if (window.electron) {
      const subscription = window.electron.on('toggle-sidebar', handleToggle);
      return () => {
        window.electron.removeListener('toggle-sidebar', subscription);
      };
    }
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const injectCursor = () => {
      // Inject CSS for fake cursor
      webview.insertCSS(`
        // * {
        //   cursor: none !important;
        // }
        #fake-cursor {
          position: fixed;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.6);
          border: 2px solid rgba(59, 130, 246, 1);
          pointer-events: none;
          z-index: 999999;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: transform 0.1s ease, background 0.1s ease;
          top: 50%;
          left: 50%;
        }
        #fake-cursor.clicking {
          transform: translate(-50%, -50%) scale(0.8);
          background: rgba(59, 130, 246, 0.9);
        }
      `);

      // Inject JavaScript for fake cursor functionality
      webview.executeJavaScript(`
        (function() {
          // Remove existing cursor if any
          const existing = document.getElementById('fake-cursor');
          if (existing) existing.remove();

          // Create fake cursor element
          const cursor = document.createElement('div');
          cursor.id = 'fake-cursor';
          document.body.appendChild(cursor);

          let x = window.innerWidth / 2;
          let y = window.innerHeight / 2;
          const step = 20;

          function updateCursor() {
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
            
            // Send move event to host
            console.log(JSON.stringify({
              type: 'USABLY_MOVE',
              x: x,
              y: y
            }));
          }

          // Initial position
          updateCursor();

          // Track arrow keys for movement
          document.addEventListener('keydown', (e) => {
            let moved = false;
            
            if (e.key === 'ArrowUp') { y -= step; moved = true; }
            if (e.key === 'ArrowDown') { y += step; moved = true; }
            if (e.key === 'ArrowLeft') { x -= step; moved = true; }
            if (e.key === 'ArrowRight') { x += step; moved = true; }
            
            if (moved) {
              e.preventDefault();
              // Clamp to screen
              x = Math.max(0, Math.min(x, window.innerWidth));
              y = Math.max(0, Math.min(y, window.innerHeight));
              updateCursor();
            }
            
            if (e.key === 'Enter') {
              e.preventDefault();
              cursor.classList.add('clicking');
              console.log(JSON.stringify({ type: 'USABLY_CLICK', x, y }));
              setTimeout(() => cursor.classList.remove('clicking'), 150);
            }
          });

          // Extract Favicon
          setTimeout(() => {
            const link = document.querySelector("link[rel*='icon']");
            const faviconUrl = link ? link.href : window.location.origin + '/favicon.ico';
            console.log(JSON.stringify({
              type: 'USABLY_FAVICON',
              url: faviconUrl
            }));
          }, 1000);
        })();
      `);
    };

    const handleConsoleMessage = (e: any) => {
      try {
        const message = JSON.parse(e.message);
        if (message.type === 'USABLY_CLICK') {
          const { x, y } = message;
          // Send native input events for a robust click
          webview.sendInputEvent({
            type: 'mouseDown',
            x,
            y,
            button: 'left',
            clickCount: 1,
          });

          setTimeout(() => {
            webview.sendInputEvent({
              type: 'mouseUp',
              x,
              y,
              button: 'left',
              clickCount: 1,
            });
          }, 50);
        } else if (message.type === 'USABLY_MOVE') {
          const { x, y } = message;
          webview.sendInputEvent({
            type: 'mouseMove',
            x,
            y,
          });
        } else if (message.type === 'USABLY_FAVICON') {
          if (message.url) {
            setCurrentFavicon(message.url);
          }
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    const handleFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        setCurrentFavicon(e.favicons[0]);
      }
    };

    webview.addEventListener('did-finish-load', injectCursor);
    webview.addEventListener('did-navigate', injectCursor);
    webview.addEventListener('console-message', handleConsoleMessage);
    webview.addEventListener('page-favicon-updated', handleFaviconUpdated);

    return () => {
      webview.removeEventListener('did-finish-load', injectCursor);
      webview.removeEventListener('did-navigate', injectCursor);
      webview.removeEventListener('console-message', handleConsoleMessage);
      webview.removeEventListener('page-favicon-updated', handleFaviconUpdated);
    };
  }, []);

  return (
    <main className='flex h-screen w-screen overflow-hidden p-2 gap-2 bg-black/50 relative sidebar-grain'>
      {isSidebarOpen && (
        <Sidebar
          onNavigate={handleNavigate}
          onBack={handleBack}
          onForward={handleForward}
          onRefresh={handleRefresh}
          onToggleSidebar={handleToggleSidebar}
          currentUrl={currentUrl}
          currentFavicon={currentFavicon}
        />
      )}

      {/* Webview */}
      <div className='flex-1 relative overflow-hidden shadow-2xl bg-white rounded-sm'>
        <webview
          ref={webviewRef}
          src={currentUrl}
          className='w-full h-full'
          webpreferences='contextIsolation=yes, nodeIntegration=no'
        />
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <div className='webview-blob' />
        </div>
      </div>
    </main>
  );
}
