'use client';

import Sidebar from '@/components/Sidebar';
import AgentBar from '@/components/AgentBar';
import BrowserBar from '@/components/BrowserBar';
import { useState, useRef, useEffect } from 'react';
import Aurora from '@/components/Aurora';
import { AnimatePresence, motion } from 'framer-motion';
import { useAgent } from '@/hooks/useAgent';
import { useCursorEffect } from '@/hooks/useCursorEffect';
import InteractiveWebview from '@/components/InteractiveWebview';

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com/');
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewportSize, setViewportSize] = useState({
    width: '100%',
    height: '100%',
  });
  const [isBrowserBarVisible, setIsBrowserBarVisible] = useState(true);

  const webviewRef = useRef<any>(null);

  // Use custom hooks for heavy logic
  useCursorEffect(webviewRef, setCurrentFavicon);

  const {
    isAgentRunning,
    isAgentFinished,
    agentThoughts,
    currentThought,
    pendingGeminiRequest,
    runFlow,
    confirmGemini,
    resetAgent,
    captureScreenshot,
  } = useAgent(webviewRef);

  const handleBackFromAgent = () => {
    resetAgent();
  };

  const handleGeminiConfirm = (confirmed: boolean) => {
    confirmGemini(confirmed);
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
              onRunFlow={runFlow}
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

      {/* Main Content Area */}
      <div
        className='flex-1 h-full relative z-10 overflow-hidden'
        onMouseMove={(e) => {
          const mouseY = e.clientY;
          if (mouseY < 80) {
            setIsBrowserBarVisible(true);
          } else if (mouseY > 150) {
            setIsBrowserBarVisible(false);
          }
        }}
      >
        {/* BrowserBar - positioned absolutely on top */}
        <div className='absolute top-4 left-0 right-0 z-50 px-4'>
          <BrowserBar
            url={currentUrl}
            onUrlChange={setCurrentUrl}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onForward={handleForward}
            onRefresh={handleRefresh}
            onViewportChange={(w: any, h: any) =>
              setViewportSize({ width: w, height: h })
            }
            isAgentRunning={isAgentRunning}
            isVisible={isBrowserBarVisible}
          />
        </div>

        {/* Interactive Webview */}
        <InteractiveWebview
          webviewRef={webviewRef}
          currentUrl={currentUrl}
          viewportSize={viewportSize}
        />
      </div>
    </main>
  );
}
