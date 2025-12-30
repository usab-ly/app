'use client';

import Sidebar from '@/components/Sidebar';
import AgentBar from '@/components/AgentBar';
import CursorControl from '@/components/CursorControl';
import KeyboardControl from '@/components/KeyboardControl';
import { useState, useRef, useEffect } from 'react';
import { PanelLeft, MousePointer2 } from 'lucide-react';
import Aurora from '@/components/Aurora';
import { AnimatePresence, motion } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('https://alg0run.netlify.app/');
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentThoughts, setAgentThoughts] = useState<string[]>([]);
  const [currentThought, setCurrentThought] = useState('');
  const webviewRef = useRef<any>(null);

  const handleRunFlow = async (flowName: string) => {
    setIsAgentRunning(true);
    setAgentThoughts([]);
    setCurrentThought(`Initializing ${flowName}...`);

    const thoughts = [
      'Analyzing page DOM structure...',
      'Identifying interactive elements...',
      'Found navigation bar and login button',
      'Calculating optimal cursor path...',
      'Moving cursor to (1024, 45)...',
      'Simulating hover state...',
      "Clicking 'Sign Up' button...",
      'Waiting for navigation event...',
      'Page loaded. Scanning form fields...',
      'Detected email and password inputs',
      'Generating synthetic test data...',
      'Typing user credentials...',
      'Validating form feedback...',
      'Submitting form...',
      'Verifying successful redirect...',
    ];

    for (const thought of thoughts) {
      setCurrentThought(thought);
      // Random delay between 800ms and 2000ms to feel more natural
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 1200)
      );
      setAgentThoughts((prev) => [...prev, thought]);
    }

    setCurrentThought('Flow completed successfully');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAgentRunning(false);
  };

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

  const handleCursorMove = (dx: number, dy: number) => {
    if (webviewRef.current) {
      webviewRef.current.executeJavaScript(`
        if (window.usablyMoveCursor) {
          window.usablyMoveCursor(${dx}, ${dy});
        }
      `);
    }
  };

  const handleCursorMoveTo = (x: number, y: number) => {
    if (webviewRef.current) {
      webviewRef.current.executeJavaScript(`
        if (window.usablyMoveCursorTo) {
          window.usablyMoveCursorTo(${x}, ${y});
        }
      `);
    }
  };

  const handleCursorClick = () => {
    if (webviewRef.current) {
      webviewRef.current.executeJavaScript(`
        if (window.usablyClickCursor) {
          window.usablyClickCursor();
        }
      `);
    }
  };

  const handleKeyPress = (key: string) => {
    if (webviewRef.current) {
      let electronKey = key;
      // Map common keys to Electron's expected format
      if (key === 'ArrowUp') electronKey = 'Up';
      if (key === 'ArrowDown') electronKey = 'Down';
      if (key === 'ArrowLeft') electronKey = 'Left';
      if (key === 'ArrowRight') electronKey = 'Right';

      try {
        webviewRef.current.sendInputEvent({
          type: 'keyDown',
          keyCode: electronKey,
        });

        if (key.length === 1) {
          webviewRef.current.sendInputEvent({
            type: 'char',
            keyCode: key,
          });
        }

        webviewRef.current.sendInputEvent({
          type: 'keyUp',
          keyCode: electronKey,
        });
      } catch (e) {
        console.error('Failed to send input event', e);
      }
    }
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
      const cursorSvg = renderToStaticMarkup(
        <MousePointer2
          size={32}
          color='#1F1E25'
          fill='#68c1ee'
          strokeWidth={1.5}
        />
      );

      // Inject CSS for fake cursor
      webview.insertCSS(`
               // * {
        //   cursor: none !important;
        // }
        #fake-cursor {
          position: fixed;
          width: 32px;
          height: 32px;
          pointer-events: none;
          z-index: 999999;
          transition: transform 0.1s ease;
          top: 50%;
          left: 50%;
          transform-origin: 0 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        #fake-cursor.clicking {
          transform: scale(0.8);
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
          cursor.innerHTML = '${cursorSvg.replace(/'/g, "\\'")}';
          document.body.appendChild(cursor);

          let x = window.innerWidth / 2;
          let y = window.innerHeight / 2;
          const step = 20;
          let animationFrameId = null;

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

          function stopAnimation() {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
          }

          function animateTo(destX, destY) {
            stopAnimation();
            
            const startX = x;
            const startY = y;
            const dist = Math.sqrt(Math.pow(destX - startX, 2) + Math.pow(destY - startY, 2));
            const duration = Math.min(2000, Math.max(600, dist * 0.8));
            let startTime = null;
            
            // Control point for Bezier curve (arc)
            const midX = (startX + destX) / 2;
            const midY = (startY + destY) / 2;
            const offset = dist * 0.25;
            const cpX = midX + (Math.random() - 0.5) * offset;
            const cpY = midY + (Math.random() - 0.5) * offset;

            function easeInOutCubic(t) {
              return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              const elapsed = timestamp - startTime;
              const progress = Math.min(1, elapsed / duration);
              const t = easeInOutCubic(progress);

              const oneMinusT = 1 - t;
              x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * cpX + t * t * destX;
              y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * cpY + t * t * destY;
              
              updateCursor();

              if (progress < 1) {
                animationFrameId = requestAnimationFrame(step);
              }
            }
            
            animationFrameId = requestAnimationFrame(step);
          }

          // Initial position
          updateCursor();

          // Expose control functions
          window.usablyMoveCursor = (dx, dy) => {
            stopAnimation();
            x += dx;
            y += dy;
            // Clamp
            x = Math.max(0, Math.min(x, window.innerWidth));
            y = Math.max(0, Math.min(y, window.innerHeight));
            updateCursor();
          };

          window.usablyMoveCursorTo = (newX, newY) => {
            // Clamp
            const targetX = Math.max(0, Math.min(newX, window.innerWidth));
            const targetY = Math.max(0, Math.min(newY, window.innerHeight));
            animateTo(targetX, targetY);
          };

          window.usablyClickCursor = () => {
            cursor.classList.add('clicking');
            console.log(JSON.stringify({ type: 'USABLY_CLICK', x, y }));
            setTimeout(() => cursor.classList.remove('clicking'), 150);
          };

          // Track arrow keys for movement
          document.addEventListener('keydown', (e) => {
            let moved = false;
            
            if (e.key === 'ArrowUp') { y -= step; moved = true; }
            if (e.key === 'ArrowDown') { y += step; moved = true; }
            if (e.key === 'ArrowLeft') { x -= step; moved = true; }
            if (e.key === 'ArrowRight') { x += step; moved = true; }
            
            if (moved) {
              e.preventDefault();
              stopAnimation();
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
    <main className='flex h-screen w-screen overflow-hidden p-2 gap-2 relative bg-black/45 '>
      {/* Animated Background */}
      <div className='absolute inset-0 -z-1 sidebar-grain opacity-50'>
        <Aurora colorStops={['#9e3668', '#a48ed8']} speed={0} />
      </div>

      <AnimatePresence mode='wait'>
        {isSidebarOpen && !isAgentRunning && (
          <motion.div
            key='sidebar'
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='h-full z-20'
          >
            <Sidebar
              onNavigate={handleNavigate}
              onBack={handleBack}
              onForward={handleForward}
              onRefresh={handleRefresh}
              onToggleSidebar={handleToggleSidebar}
              onRunFlow={handleRunFlow}
              currentUrl={currentUrl}
              currentFavicon={currentFavicon}
            />
          </motion.div>
        )}
        {isAgentRunning && (
          <motion.div
            key='agentbar'
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='h-full z-20'
          >
            <AgentBar
              isRunning={isAgentRunning}
              thoughts={agentThoughts}
              currentThought={currentThought}
              onStop={() => setIsAgentRunning(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      {/* <div className='z-20 flex flex-col items-center justify-center px-2 gap-2'>
        <CursorControl
          onMove={handleCursorMove}
          onMoveTo={handleCursorMoveTo}
          onClick={handleCursorClick}
        />
        <KeyboardControl onKeyPress={handleKeyPress} />
      </div> */}

      {/* Webview */}
      <div className='flex-1 relative overflow-hidden shadow-2xl bg-white rounded-sm z-10'>
        <webview
          ref={webviewRef}
          src={currentUrl}
          className='w-full h-full'
          webpreferences='contextIsolation=yes, nodeIntegration=no'
        />

        <div className='absolute w-full h-full inset-0 rotate-180 z-1 opacity-70'>
          <Aurora
            colorStops={['#68c1ee', '#68c1ee', '#68c1ee', '#68c1ee']}
            blend={1}
            amplitude={0.2}
            speed={3}
          />
        </div>
        <div className='absolute w-full h-full inset-0 z-1 opacity-70'>
          <Aurora
            colorStops={['#68c1ee', '#68c1ee', '#68c1ee', '#68c1ee']}
            blend={1}
            amplitude={0.2}
            speed={3}
          />
        </div>
      </div>
    </main>
  );
}
