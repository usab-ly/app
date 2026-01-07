import { useEffect, RefObject } from 'react';
import { MousePointer2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

export const useCursorEffect = (
  webviewRef: RefObject<any>,
  setCurrentFavicon: (favicon: string | null) => void
) => {
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const injectCursor = async () => {
      try {
        // Check if webview is ready
        if (!webview || !webview.getURL()) {
          console.log('Webview not ready, skipping cursor injection');
          return;
        }

        const cursorSvg = renderToStaticMarkup(
          <MousePointer2
            size={32}
            color='#1F1E25'
            fill='#68c1ee'
            strokeWidth={1.5}
          />
        );

        // Inject CSS for fake cursor
        await webview.insertCSS(`
               // * {
        //   cursor: none !important;
        // }
        #fake-cursor {
          position: fixed;
          width: 32px;
          height: 32px;
          pointer-events: none;
          z-index: 2147483647 !important;
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
        await webview.executeJavaScript(`
          (function() {
            try {
              // Remove existing cursor if any
              const existing = document.getElementById('fake-cursor');
              if (existing) existing.remove();

          // Create fake cursor element
          const cursor = document.createElement('div');
          cursor.id = 'fake-cursor';
          cursor.innerHTML = '${cursorSvg.replace(/'/g, "\\'")}';
          document.body.appendChild(cursor);

          // // Ensure cursor stays on top
          // const observer = new MutationObserver(() => {
          //   if (document.body.lastElementChild !== cursor) {
          //     document.body.appendChild(cursor);
          //   }
          // });
          // observer.observe(document.body, { childList: true });

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

          window.usablyGetCursorPosition = () => {
            return { x, y };
          };
              // Extract Favicon
              setTimeout(() => {
                const link = document.querySelector("link[rel*='icon']");
                const faviconUrl = link ? link.href : window.location.origin + '/favicon.ico';
                console.log(JSON.stringify({
                  type: 'USABLY_FAVICON',
                  url: faviconUrl
                }));
              }, 1000);
            } catch (err) {
              console.error('Cursor injection error:', err);
            }
          })();
        `);
      } catch (error) {
        console.error('Failed to inject cursor:', error);
      }
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
  }, [webviewRef, setCurrentFavicon]);
};
