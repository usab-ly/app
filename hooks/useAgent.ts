import { useState, RefObject } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentAction } from '@/server/trpc/types';

export const useAgent = (webviewRef: RefObject<any>) => {
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
        console.log('Sending key press:', key);
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
            // Scroll at cursor position with smooth wheel events
            await webviewRef.current.executeJavaScript(`
              (function() {
                const cursorPos = window.usablyGetCursorPosition ? window.usablyGetCursorPosition() : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                const targetElement = document.elementFromPoint(cursorPos.x, cursorPos.y);
                
                if (targetElement) {
                  // Dispatch smooth wheel event at cursor position
                  const wheelEvent = new WheelEvent('wheel', {
                    deltaX: ${scrollX},
                    deltaY: ${scrollY},
                    deltaMode: 0,
                    bubbles: true,
                    cancelable: true,
                    clientX: cursorPos.x,
                    clientY: cursorPos.y
                  });
                  targetElement.dispatchEvent(wheelEvent);
                  
                  // Fallback: smooth scroll the element or window
                  const scrollableParent = (function findScrollable(el) {
                    while (el && el !== document.body) {
                      const overflow = window.getComputedStyle(el).overflow;
                      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') {
                        return el;
                      }
                      el = el.parentElement;
                    }
                    return window;
                  })(targetElement);
                  
                  if (scrollableParent === window) {
                    window.scrollBy({ top: ${scrollY}, left: ${scrollX}, behavior: 'smooth' });
                  } else {
                    scrollableParent.scrollBy({ top: ${scrollY}, left: ${scrollX}, behavior: 'smooth' });
                  }
                }
              })();
            `);
            // Wait for scroll animation
            await new Promise((r) => setTimeout(r, 750));
          }
        }
        break;
      default:
        console.warn('Unknown action type:', type);
    }
  };

  const captureScreenshot = async (): Promise<{
    image: string;
    elements: Array<{
      x: number;
      y: number;
      tag: string;
      text: string;
      type: string;
      id: string;
      class: string;
    }>;
  } | null> => {
    if (!webviewRef.current) return null;
    try {
      await new Promise((r) => setTimeout(r, 800));

      // Extract interactive elements data (only visible in viewport)
      const elementsData = await webviewRef.current.executeJavaScript(`
        (function() {
          try {
            const interactiveSelectors = 'a, button, input, textarea, select, [onclick], [role="button"], [tabindex]:not([tabindex="-1"])';
            const elements = document.querySelectorAll(interactiveSelectors);
          const data = [];
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          elements.forEach((el) => {
            if (!el.offsetParent && el.tagName !== 'BODY') return;
            
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            
            // Only include elements visible in the current viewport
            const centerX = Math.round(rect.left + rect.width / 2);
            const centerY = Math.round(rect.top + rect.height / 2);
            
            // Check if element center is within viewport bounds
            if (centerX < 0 || centerX > viewportWidth || centerY < 0 || centerY > viewportHeight) {
              return; // Skip elements outside viewport
            }
            
            // Get element text content (trimmed, max 50 chars)
            let text = el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
            text = text.trim().substring(0, 50);
            
            data.push({
              x: centerX,
              y: centerY,
              tag: el.tagName.toLowerCase(),
              type: el.type || '',
              text: text,
              id: el.id || '',
              class: el.className || ''
            });
          });
          
          return data;
        } catch (err) {
          console.error('Element extraction error:', err);
          return [];
        }
        })();
      `);

      await new Promise((r) => setTimeout(r, 150));
      const image = await webviewRef.current.capturePage();

      // Convert to JPEG using Canvas to ensure robust conversion in renderer process
      const pngDataUrl = image.toDataURL();
      const jpegBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Fill white background as JPEG doesn't support transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
          } else {
            resolve(pngDataUrl.split(',')[1]);
          }
        };
        img.onerror = () => resolve(pngDataUrl.split(',')[1]);
        img.src = pngDataUrl;
      });

      return {
        image: jpegBase64,
        elements: elementsData,
      };
    } catch (e) {
      console.error('Failed to capture screenshot', e);
      return null;
    }
  };

  const runFlow = async (flowName: string, flowGoal?: string) => {
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

    const systemPrompt = `
      You are an AI user testing agent. Your goal is: "${goal}".
      STRICTLY focus on this goal. Do not perform any actions that are not directly required to achieve this goal.

      TARGETING INSTRUCTIONS:
      1. You will be provided with a list of visible interactive elements and a screenshot at each step.
      2. If the list seems incomplete or you need elements below, you MUST scroll down first.
      3. Each element in the list will show: tag, type, position (x,y), visible text, and attributes.
      4. To interact with an element, use its EXACT (x, y) coordinates from the list.
      5. Describe elements naturally in your rationale (e.g., "the Sign Up button" or "the search input").
      6. DO NOT reference elements by bracket numbers [0], [1] in your rationale - use descriptive names.
      7. If you need an element not in the list, scroll to reveal it first.
      8. ALWAYS target element centers, never edges.

      CRITICAL RULES:
      1. Always include 'moveCursor' action before 'click' action
      2. To type in an input: moveCursor → click → type
      3. Do not hallucinate - only use visible elements from the list
      4. Use 'finish' ONLY when goal is fully achieved
      5. Do not plan actions for future states - only current screenshot
      6. Prefer 'pressKey' with Enter after typing instead of clicking submit
      7. If goal is achieved, return ONLY 'finish' action
      8. If action causes navigation, it MUST be last action in array
      9. For hidden elements (dropdowns, date pickers), click trigger first, wait for next screenshot
      10. Act like a real user - scroll down if page seems incomplete
      
      ADAPTIVE BEHAVIOR:
      11. If you need an element that's not in the visible list:
          - Scroll down (y=400-600) to reveal more content
          - Scroll up (y=-400-600) if you went too far
          - The element list will update to show newly visible elements
      12. If page seems incomplete (few elements, content cuts off):
          - Scroll down to see more before taking action
          - Check if important elements are below the fold
      13. If page unchanged after actions, try:
          - Adjust coordinates by ±10-20px
          - Scroll to reveal more content
          - Try different areas of same element
          - Wait longer (3000-5000ms)
      14. If click didn't work:
          - Element might be obscured - scroll or close overlays
          - Coordinates might be off - adjust and retry
          - Try double-click or keyboard navigation
      15. If stuck (same screenshot 2+ times):
          - Change strategy completely
          - Scroll to different sections first
          - Use keyboard (Tab, Enter, Arrows)
          - Look for mobile/alternative navigation
      
      Return a JSON array of actions. Each action has 'type' and 'details'.
      Types: moveCursor, click, type, wait, pressKey, scroll, finish, fail
      
      Example:
      [
        { "type": "moveCursor", "details": { "x": 427, "y": 285 }, "rationale": "Moving to the Sign Up button" },
        { "type": "click", "rationale": "Clicking Sign Up button" },
        { "type": "wait", "details": { "duration": 1500 }, "rationale": "Waiting for page load" },
        { "type": "scroll", "details": { "x": 0, "y": 400 }, "rationale": "Scrolling down to reveal more options" },
        { "type": "finish", "rationale": "Goal achieved successfully" },
        { "type": "pressKey", "details":{"key":"Enter"}, "rationale": "Submitting the form by pressing Enter"}
      ]
      
      Only return the JSON array. No markdown formatting.
    `;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Understood. I will act as the AI user testing agent following these rules. Please provide the current page state and screenshot.',
            },
          ],
        },
      ],
    });

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

        const screenshotData = await captureScreenshot();
        if (!screenshotData) {
          setAgentThoughts((prev) => [
            ...prev,
            { text: 'Failed to capture screenshot', type: 'fail' },
          ]);
          break;
        }

        const { image: base64Image, elements } = screenshotData;

        // Add screenshot to thoughts for visualization
        setAgentThoughts((prev) => [
          ...prev,
          {
            text: `Analyzed page state`,
            image: base64Image,
            type: 'analysis',
          },
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

        // Format elements for prompt
        const elementsText = elements
          .map(
            (el) =>
              `${el.tag}${el.type ? `:${el.type}` : ''} (${el.x},${el.y})${el.id ? `#${el.id}` : ''}${el.class ? `.${el.class.split(' ')[0]}` : ''}${el.text ? ` "${el.text}"` : ''}`
          )
          .join('\n');

        const stepPrompt = `
          VISIBLE INTERACTIVE ELEMENTS (current viewport only):
          ${elementsText}
          
          TARGETING INSTRUCTIONS:
          1. The list above shows ONLY elements visible in the current viewport (screenshot)
          2. If the list seems incomplete or you need elements below, you MUST scroll down first.

          Analyze the current page state (screenshot provided) and the element list above.
          Based on the goal "${goal}", provide the next set of actions as a JSON array.
        `;

        console.log('Sending prompt to Gemini:', stepPrompt);
        const result = await chat.sendMessage([
          stepPrompt,
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
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

            const finalData = await captureScreenshot();
            if (finalData) {
              const finalElementsText = finalData.elements
                .map(
                  (el, idx) =>
                    `[${idx}] ${el.tag} at (${el.x}, ${el.y})${el.text ? ` - "${el.text}"` : ''}`
                )
                .join('\n');

              const verificationPrompt = `
                Goal: "${goal}"
                The agent believes the goal is complete.
                
                Elements on page:
                ${finalElementsText}
                
                Analyze the screenshot and element list.
                Is the goal truly accomplished?
                Return JSON: { "success": boolean, "reason": string }
              `;

              const verificationResult = await model.generateContent([
                verificationPrompt,
                {
                  inlineData: {
                    data: finalData.image,
                    mimeType: 'image/jpeg',
                  },
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
                      image: finalData.image,
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
                      image: finalData.image,
                      type: 'fail',
                    },
                  ]);
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

  const resetAgent = () => {
    setIsAgentFinished(false);
    setAgentThoughts([]);
    setCurrentThought('');
    setPendingGeminiRequest(false);
    setGeminiConfirmResolver(null);
  };

  const confirmGemini = (confirmed: boolean) => {
    if (geminiConfirmResolver) {
      geminiConfirmResolver(confirmed);
    }
    setPendingGeminiRequest(false);
    setGeminiConfirmResolver(null);
  };

  return {
    isAgentRunning,
    isAgentFinished,
    agentThoughts,
    currentThought,
    debugMode,
    setDebugMode,
    pendingGeminiRequest,
    runFlow,
    confirmGemini,
    resetAgent,
    handleKeyPress,
    handleCursorMoveTo,
    handleCursorClick,
    captureScreenshot,
  };
};
