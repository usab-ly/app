'use client';

import Sidebar from '@/components/Sidebar';
import AgentBar from '@/components/AgentBar';
import BrowserBar from '@/components/BrowserBar';
import CursorControl from '@/components/CursorControl';
import KeyboardControl from '@/components/KeyboardControl';
import { useState, useRef, useEffect } from 'react';
import { PanelLeft, MousePointer2 } from 'lucide-react';
import Aurora from '@/components/Aurora';
import { AnimatePresence, motion } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentAction } from '@/server/trpc/types';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('https://www.knowlify.com/');
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isAgentFinished, setIsAgentFinished] = useState(false);
  const [agentThoughts, setAgentThoughts] = useState<
    { text: string; image?: string; type?: string }[]
  >([]);
  const [currentThought, setCurrentThought] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [pendingGeminiRequest, setPendingGeminiRequest] = useState(false);
  const [geminiConfirmResolver, setGeminiConfirmResolver] = useState<
    ((value: boolean) => void) | null
  >(null);
  const [viewportSize, setViewportSize] = useState({
    width: '100%',
    height: '100%',
  });
  const webviewRef = useRef<any>(null);

  const captureScreenshot = async (): Promise<string | null> => {
    if (!webviewRef.current) return null;
    try {
      // Inject ruler overlay for AI context
      await new Promise((r) => setTimeout(r, 3000));

      await webviewRef.current.executeJavaScript(`
        (function() {
          const id = 'usably-ruler-overlay';
          if (document.getElementById(id)) return;
          
          const overlay = document.createElement('div');
          overlay.id = id;
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;font-family:monospace;font-size:11px;font-weight:bold;color:white;text-shadow: 1px 1px 0 #000;';
          
          const step = 50;
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          // X-axis grid & labels
          for (let x = 0; x < width; x += step) {
            const labelTop = document.createElement('div');
            labelTop.innerText = x;
            labelTop.style.cssText = 'position:absolute;left:' + (x + 2) + 'px;top:0;color:white;background:rgba(0,0,0,0.7);padding:1px 3px;border-radius:2px;';
            overlay.appendChild(labelTop);

            const labelBottom = document.createElement('div');
            labelBottom.innerText = x;
            labelBottom.style.cssText = 'position:absolute;left:' + (x + 2) + 'px;bottom:0;color:white;background:rgba(0,0,0,0.7);padding:1px 3px;border-radius:2px;';
            overlay.appendChild(labelBottom);
            
            const line = document.createElement('div');
            line.style.cssText = 'position:absolute;left:' + x + 'px;top:0;width:1px;height:100%;background:rgba(255,255,255,0.2);box-shadow: 0 0 1px rgba(0,0,0,0.5);';
            overlay.appendChild(line);
          }
          
          // Y-axis grid & labels
          for (let y = 0; y < height; y += step) {
            if (y === 0) continue;
            const labelLeft = document.createElement('div');
            labelLeft.innerText = y;
            labelLeft.style.cssText = 'position:absolute;top:' + (y + 2) + 'px;left:0;color:white;background:rgba(0,0,0,0.7);padding:1px 3px;border-radius:2px;';
            overlay.appendChild(labelLeft);

            const labelRight = document.createElement('div');
            labelRight.innerText = y;
            labelRight.style.cssText = 'position:absolute;top:' + (y + 2) + 'px;right:0;color:white;background:rgba(0,0,0,0.7);padding:1px 3px;border-radius:2px;';
            overlay.appendChild(labelRight);
            
            const line = document.createElement('div');
            line.style.cssText = 'position:absolute;top:' + y + 'px;left:0;width:100%;height:1px;background:rgba(255,255,255,0.2);box-shadow: 0 0 1px rgba(0,0,0,0.5);';
            overlay.appendChild(line);
          }
          
          document.body.appendChild(overlay);
        })();
      `);

      // Wait for render
      await new Promise((r) => setTimeout(r, 150));

      const image = await webviewRef.current.capturePage();

      // Remove ruler
      await webviewRef.current.executeJavaScript(`
        (function() {
          const overlay = document.getElementById('usably-ruler-overlay');
          if (overlay) overlay.remove();
        })();
      `);

      return image.toDataURL().split(',')[1];
    } catch (e) {
      console.error('Failed to capture screenshot', e);
      return null;
    }
  };

  const executeAction = async (action: AgentAction) => {
    const { type, details } = action;

    switch (type) {
      case 'moveCursor':
        if (details?.x !== undefined && details?.y !== undefined) {
          handleCursorMoveTo(details.x, details.y);
        }
        break;
      case 'click':
        handleCursorClick();
        break;
      case 'type':
        if (details?.text) {
          console.log('Typing text:', details.text);
          for (const char of details.text) {
            handleKeyPress(char);
            await new Promise((r) => setTimeout(r, 50 + Math.random() * 50));
          }
        }
        break;
      case 'wait':
        await new Promise((r) => setTimeout(r, details?.duration || 1000));
        break;
      case 'pressKey':
        if (details?.key) {
          handleKeyPress(details.key);
        }
        break;
      case 'scroll':
        if (details?.x !== undefined || details?.y !== undefined) {
          const scrollX = details.x || 0;
          const scrollY = details.y || 0;
          if (webviewRef.current) {
            await webviewRef.current.executeJavaScript(
              `window.scrollBy({ top: ${scrollY}, left: ${scrollX}, behavior: 'smooth' })`
            );
            // Wait for scroll animation
            await new Promise((r) => setTimeout(r, 750));
          }
        }
        break;
    }
  };

  const handleRunFlow = async (flowName: string, flowGoal?: string) => {
    setIsAgentRunning(true);
    setIsAgentFinished(false);
    setAgentThoughts([]);
    setCurrentThought(`Initializing ${flowName}...`);

    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    );
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const goal =
      flowGoal ||
      `Complete the flow: ${flowName}. The user wants to test this flow.`;
    let step = 0;
    const maxSteps = 10;

    const askGemini = (): Promise<boolean> => {
      if (!debugMode) return Promise.resolve(true);

      return new Promise((resolve) => {
        setPendingGeminiRequest(true);
        setGeminiConfirmResolver(() => resolve);
      });
    };

    try {
      while (step < maxSteps) {
        step++;
        console.log(`Agent Step ${step} for flow ${flowName}`);
        setCurrentThought('Analyzing page...');

        const base64Image = await captureScreenshot();
        if (!base64Image) {
          setAgentThoughts((prev) => [
            ...prev,
            { text: 'Failed to capture screenshot', type: 'fail' },
          ]);
          break;
        }

        // Add screenshot to thoughts for visualization
        setAgentThoughts((prev) => [
          ...prev,
          { text: 'Analyzed page state', image: base64Image, type: 'analysis' },
        ]);

        // Ask for confirmation before Gemini request in debug mode
        const shouldContinue = await askGemini();
        if (!shouldContinue) {
          setAgentThoughts((prev) => [
            ...prev,
            { text: 'Agent paused by user', type: 'fail' },
          ]);
          setIsAgentRunning(false);
          setIsAgentFinished(true);
          return;
        }

        const prompt = `
          You are an AI user testing agent. Your goal is: "${goal}".
          STRICTLY focus on this goal. Do not perform any actions that are not directly required to achieve this goal.
          Analyze the screenshot of the web page.
          The screenshot includes a white ruler/grid overlay to help you identify coordinates.
          The rulers show pixel positions on all edges (top/bottom for X, left/right for Y). Grid lines appear every 50 pixels.

          Return a JSON object with a plan of actions to execute.
          The JSON should be an array of actions.
          Each action has a 'type' (moveCursor, click, type, wait, pressKey, scroll, finish, fail) and 'details'.
          
          IMPORTANT:
          1. Always include a 'moveCursor' action to the exact coordinates before a 'click' action.
          2. If you intend to 'type' text, you MUST first 'moveCursor' to the input field, then 'click' to focus it, and then 'type'.
          3. Use the rulers to precisely estimate the X and Y coordinates of the element you want to interact with. X is horizontal, Y is vertical. CRITICAL: When targeting an element, ALWAYS aim for the CENTER of the element, not the edges.
          4. Do not hallucinate. All actions must be strictly based on the visual information in the screenshot.
          5. The 'finish' action is NOT required in every response. Only use 'finish' when you are certain the goal has been fully achieved.
          6. Do not assume the outcome of your actions. Only plan the immediate steps visible and actionable in the current screenshot. Do not plan actions for future states (e.g., after a page load, or after a popup/date picker appears).
          7. When submitting forms or textboxes etc., prefer using 'pressKey' with details: { "key": "Enter" } immediately after typing, rather than clicking a submit button.
          8. If the goal is already achieved based on the screenshot, return ONLY a 'finish' action.
          9. If an action is likely to cause a page navigation or significant layout change (like clicking a submit button, link, or pressing Enter on a form), it MUST be the last action in the array.
          10. CRITICAL: If you need to interact with a hidden element (like a date inside a date picker, an item in a dropdown, or a modal), ONLY click the trigger element first. Do not try to click the date/item in the same plan. Wait for the next screenshot to see the open picker/menu.
          11. STRICTLY adhere to the goal. Do not click on ads, unrelated links, or explore features not requested. If the goal is specific (e.g. "login"), do not try to "sign up" or "reset password" unless necessary.
          12. Act like a real user. If you are unsure where to find an element or if the page seems incomplete, try scrolling down to explore more content, just like a human would.
          
          ADAPTIVE BEHAVIOR - CRITICAL FOR SUCCESS:
          13. If the page looks identical to previous screenshots and your last actions didn't produce visible changes, DO NOT repeat the same actions. Instead:
              - Try adjusting cursor position slightly (offset by 10-20 pixels in different directions)
              - Try scrolling to reveal more content (use 'scroll' with y=300-500 for down, y=-300 to -500 for up)
              - Try clicking different areas of the same element (top, bottom, left, right of center)
              - Wait longer for page responses (increase 'wait' duration to 3000-5000ms)
              - Look for alternative elements (different buttons, links, or input methods)
          14. If you attempted to click an element but nothing happened (page unchanged), consider:
              - The element might be obscured by another layer - try scrolling or looking for close buttons
              - The click coordinates might be slightly off - adjust by ±15-30 pixels and try again
              - The element might require a double-click or longer press - try clicking twice
              - There might be a hover menu or tooltip - move cursor without clicking first
          15. If you're stuck in a loop (same screenshot multiple times), try a completely different approach:
              - Use keyboard navigation instead of mouse (Tab, Enter, Arrow keys)
              - Scroll to a different section of the page to find alternative paths
              - Look for mobile/alternative navigation patterns (hamburger menus, dropdowns)
              - Consider whether the element is interactive at all - look for other similar elements
          16. Verify progress by comparing this screenshot with your mental model of previous ones. If no progress in 2 consecutive iterations, change strategy completely.

          For 'moveCursor', provide 'x' and 'y' coordinates based on the screenshot.
          For 'type', provide 'text'.
          For 'pressKey', provide 'key'.
          For 'scroll', provide 'x' and 'y' as scroll amount (deltas). e.g. y=500 to scroll down, y=-500 to scroll up.
          For 'wait', provide 'duration' in ms.
          For 'finish', the goal is achieved.
          For 'fail', the goal cannot be achieved.
          
          Example:
          [
            { "type": "moveCursor", "details": { "x": 500, "y": 300 }, "rationale": "Moving to Sign Up button" },
            { "type": "click", "rationale": "Clicking Sign Up" },
            { "type": "wait", "details": { "duration": 2000 }, "rationale": "Waiting for page load" }
          ]
          
          Only return the JSON array. No markdown formatting.
        `;

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
        ]);

        const responseText = result.response.text();
        console.log('Gemini Response:', responseText);

        let actions: AgentAction[] = [];
        try {
          let jsonString = responseText;
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1];
          } else {
            const firstOpen = responseText.indexOf('[');
            const lastClose = responseText.lastIndexOf(']');
            if (firstOpen !== -1 && lastClose !== -1) {
              jsonString = responseText.substring(firstOpen, lastClose + 1);
            }
          }
          actions = JSON.parse(jsonString);
        } catch (e) {
          console.error('Failed to parse JSON', e);
          setAgentThoughts((prev) => [
            ...prev,
            { text: 'Error parsing AI response', type: 'fail' },
          ]);
          continue;
        }

        for (const action of actions) {
          if (action.type === 'finish') {
            // Verify completion with one final check
            setCurrentThought('Verifying goal completion...');
            await new Promise((r) => setTimeout(r, 1000)); // Wait for any final transitions

            const finalScreenshot = await captureScreenshot();
            if (finalScreenshot) {
              const verificationPrompt = `
                Goal: "${goal}"
                The agent believes the goal is complete.
                Analyze this final screenshot.
                Is the goal truly accomplished?
                Return JSON: { "success": boolean, "reason": string }
              `;

              const verificationResult = await model.generateContent([
                verificationPrompt,
                {
                  inlineData: { data: finalScreenshot, mimeType: 'image/png' },
                },
              ]);

              const verificationText = verificationResult.response.text();
              console.log('Verification:', verificationText);

              try {
                let jsonString = verificationText;
                const jsonMatch = verificationText.match(
                  /```json\s*([\s\S]*?)\s*```/
                );
                if (jsonMatch) {
                  jsonString = jsonMatch[1];
                } else {
                  const firstOpen = verificationText.indexOf('{');
                  const lastClose = verificationText.lastIndexOf('}');
                  if (firstOpen !== -1 && lastClose !== -1) {
                    jsonString = verificationText.substring(
                      firstOpen,
                      lastClose + 1
                    );
                  }
                }

                const verification = JSON.parse(jsonString);

                if (verification.success) {
                  setCurrentThought('Flow completed successfully!');
                  setAgentThoughts((prev) => [
                    ...prev,
                    {
                      text: 'Goal verified & achieved',
                      image: finalScreenshot,
                      type: 'success',
                    },
                  ]);
                  setIsAgentRunning(false);
                  setIsAgentFinished(true);
                  return;
                } else {
                  setCurrentThought(
                    'Goal not yet fully achieved. Continuing...'
                  );
                  setAgentThoughts((prev) => [
                    ...prev,
                    {
                      text: `Verification failed: ${verification.reason}`,
                      image: finalScreenshot,
                      type: 'fail',
                    },
                  ]);
                  setIsAgentRunning(true);
                  // Continue the loop to fix issues
                  continue;
                }
              } catch (e) {
                console.error('Verification parse error', e);
                // If parse fails, assume success to avoid infinite loops if it was actually done
                setCurrentThought('Flow completed successfully!');
                setIsAgentRunning(false);
                return;
              }
            }

            setCurrentThought('Flow completed successfully!');
            setAgentThoughts((prev) => [
              ...prev,
              { text: 'Goal achieved', type: 'success' },
            ]);
            setIsAgentRunning(false);
            setIsAgentFinished(true);
            return;
          }
          if (action.type === 'fail') {
            setCurrentThought('Flow failed.');
            setAgentThoughts((prev) => [
              ...prev,
              {
                text: action.rationale || 'Failed to complete flow',
                type: 'fail',
              },
            ]);
            setIsAgentRunning(false);
            setIsAgentFinished(true);
            return;
          }

          setCurrentThought(action.rationale || `Executing ${action.type}...`);
          await executeAction(action);
          setAgentThoughts((prev) => [
            ...prev,
            { text: action.rationale || action.type, type: action.type },
          ]);

          // Small delay between actions (~1 second)
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Wait a bit before next analysis
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error('Agent error:', error);
      setAgentThoughts((prev) => [
        ...prev,
        { text: 'An error occurred during execution', type: 'fail' },
      ]);
    }

    setIsAgentRunning(false);
    setIsAgentFinished(true);
  };

  const handleBackFromAgent = () => {
    setIsAgentFinished(false);
    setAgentThoughts([]);
    setCurrentThought('');
    setPendingGeminiRequest(false);
    setGeminiConfirmResolver(null);
  };

  const handleGeminiConfirm = (confirmed: boolean) => {
    if (geminiConfirmResolver) {
      geminiConfirmResolver(confirmed);
    }
    setPendingGeminiRequest(false);
    setGeminiConfirmResolver(null);
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
        {isSidebarOpen && !isAgentRunning && !isAgentFinished && (
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
        {(isAgentRunning || isAgentFinished) && (
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
              isFinished={isAgentFinished}
              thoughts={agentThoughts}
              currentThought={currentThought}
              onStop={() => captureScreenshot()}
              onBack={handleBackFromAgent}
              pendingGeminiRequest={pendingGeminiRequest}
              onGeminiConfirm={handleGeminiConfirm}
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

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col gap-2 h-full relative z-10 overflow-hidden'>
        <BrowserBar
          url={currentUrl}
          onUrlChange={setCurrentUrl}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onForward={handleForward}
          onRefresh={handleRefresh}
          onViewportChange={(w, h) => setViewportSize({ width: w, height: h })}
          isAgentRunning={isAgentRunning}
        />

        <div className='flex-1 flex items-center justify-center overflow-hidden relative'>
          <div
            className='relative overflow-hidden shadow-2xl bg-white rounded-sm transition-all duration-300 ease-in-out'
            style={{ width: viewportSize.width, height: viewportSize.height }}
          >
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
            <div className='absolute w-full h-full inset-0 z-1 opacity-70 pointer-events-none'>
              <Aurora
                colorStops={['#68c1ee', '#68c1ee', '#68c1ee', '#68c1ee']}
                blend={1}
                amplitude={0.2}
                speed={3}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
