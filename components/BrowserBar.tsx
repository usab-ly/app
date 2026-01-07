import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Plus,
  Maximize,
} from 'lucide-react';

interface BrowserBarProps {
  url: string;
  onUrlChange: (url: string) => void;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onViewportChange: (width: string, height: string) => void;
  isAgentRunning: boolean;
  isVisible: boolean;
}

export default function BrowserBar({
  url,
  onUrlChange,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onViewportChange,
  isAgentRunning,
  isVisible,
}: BrowserBarProps) {
  const [inputUrl, setInputUrl] = useState(url);
  const [activeViewport, setActiveViewport] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let targetUrl = inputUrl;
      if (
        !targetUrl.startsWith('http://') &&
        !targetUrl.startsWith('https://')
      ) {
        targetUrl = 'https://' + targetUrl;
      }
      onNavigate(targetUrl);
    }
  };

  const handleViewportClick = (type: 'desktop' | 'tablet' | 'mobile') => {
    setActiveViewport(type);
    switch (type) {
      case 'mobile':
        onViewportChange('375px', '667px');
        break;
      case 'tablet':
        onViewportChange('640px', '853px');
        break;
      case 'desktop':
        onViewportChange('100%', '100%');
        break;
    }
  };

  const getViewportIcon = () => {
    switch (activeViewport) {
      case 'mobile':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Tablet size={16} />;
      case 'desktop':
        return <Monitor size={16} />;
    }
  };

  const cycleViewport = () => {
    const cycle = {
      desktop: 'tablet',
      tablet: 'mobile',
      mobile: 'desktop',
    } as const;
    handleViewportClick(cycle[activeViewport]);
  };

  return (
    <div
      className='flex items-center justify-center gap-3 text-white/90 z-50 transition-all duration-500 ease-out mx-auto'
      style={{
        transform: isVisible
          ? 'translateY(0) scale(1)'
          : 'translateY(-20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Center - URL Bar */}
      <div className='flex-1 flex max-w-125 items-center gap-3 p-1 bg-black backdrop-blur-3xl rounded-4xl group transition-all duration-300'>
        <button
          onClick={cycleViewport}
          className='flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full'
          title={`Current: ${activeViewport.charAt(0).toUpperCase() + activeViewport.slice(1)} (click to cycle)`}
        >
          {getViewportIcon()}
        </button>

        <input
          type='text'
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAgentRunning}
          className='flex-1 bg-transparent text-xs text-white/90 outline-none placeholder:text-white/30 disabled:opacity-50'
          placeholder='Enter URL...'
        />

        <div className='flex items-center gap-2'>
          <button
            onClick={onBack}
            disabled={isAgentRunning}
            className='p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-all duration-200'
            title='Back'
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={onForward}
            disabled={isAgentRunning}
            className='p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-all duration-200'
            title='Forward'
          >
            <ArrowRight size={16} />
          </button>
        </div>

        <div className='w-px h-5 bg-white/10' />

        <button
          onClick={onRefresh}
          disabled={isAgentRunning}
          className='p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-all duration-200'
          title='Refresh'
        >
          <RotateCw size={16} />
        </button>
      </div>
    </div>
  );
}
