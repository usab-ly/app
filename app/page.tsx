'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const webviewRef = useRef<any>(null);

  const handleNavigate = (url: string) => {
    setCurrentUrl(url);
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const injectCursor = () => {
      // Inject CSS for fake cursor
      webview.insertCSS(`
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
      webview.executeJavaScript(`
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
    };

    webview.addEventListener('did-finish-load', injectCursor);
    webview.addEventListener('did-navigate', injectCursor);

    return () => {
      webview.removeEventListener('did-finish-load', injectCursor);
      webview.removeEventListener('did-navigate', injectCursor);
    };
  }, []);

  return (
    <main className='flex h-screen w-screen overflow-hidden p-2 gap-2'>
      <Sidebar onNavigate={handleNavigate} currentUrl={currentUrl} />
      <div className='flex-1 relative rounded-md overflow-hidden shadow-2xl bg-white shadow-sm'>
        <webview
          ref={webviewRef}
          src={currentUrl}
          className='w-full h-full'
          webpreferences='contextIsolation=yes, nodeIntegration=no'
        />
      </div>
    </main>
  );
}
