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
        onViewportChange('768px', '1024px');
        break;
      case 'desktop':
        onViewportChange('100%', '100%');
        break;
    }
  };

  return (
    <div className='flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a]/95 backdrop-blur-xl text-white/90 rounded-2xl shadow-2xl border border-white/[0.08]'>
      {/* Left section - Preview/Globe icon */}
      <button
        className='flex items-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] rounded-xl transition-all duration-200 border border-white/[0.12]'
        title='Preview'
      >
        <Globe size={20} className='text-blue-400' />
        <span className='text-sm font-medium'>Preview</span>
      </button>

      {/* Cloud/Save button */}
      <button
        className='p-2.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-all duration-200 border border-white/[0.08]'
        title='Save'
      >
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
          <polyline points='17 21 17 13 7 13 7 21' />
          <polyline points='7 3 7 8 15 8' />
        </svg>
      </button>

      {/* New tab button */}
      <button
        className='p-2.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-all duration-200 border border-white/[0.08]'
        title='New Tab'
      >
        <Plus size={20} />
      </button>

      {/* Center - URL Bar */}
      <div className='flex-1 flex items-center gap-3 px-4 py-2.5 bg-black/20 rounded-xl border border-white/[0.08] group hover:border-white/[0.15] transition-all duration-200'>
        <div className='flex items-center gap-2 text-sm text-white/60'>
          <Monitor size={16} />
          <span>/</span>
        </div>

        <input
          type='text'
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAgentRunning}
          className='flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/30 disabled:opacity-50'
          placeholder='Enter URL...'
        />

        <div className='flex items-center gap-2'>
          <button
            onClick={onBack}
            disabled={isAgentRunning}
            className='p-1 hover:bg-white/[0.1] rounded-lg disabled:opacity-30 transition-all duration-200'
            title='Back'
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={onForward}
            disabled={isAgentRunning}
            className='p-1 hover:bg-white/[0.1] rounded-lg disabled:opacity-30 transition-all duration-200'
            title='Forward'
          >
            <ArrowRight size={16} />
          </button>
        </div>

        <div className='w-px h-5 bg-white/10' />

        <button
          onClick={onRefresh}
          disabled={isAgentRunning}
          className='p-1 hover:bg-white/[0.1] rounded-lg disabled:opacity-30 transition-all duration-200'
          title='Refresh'
        >
          <RotateCw size={16} />
        </button>
      </div>

      {/* Right section - Viewport controls */}
      <div className='flex items-center gap-2'>
        <button
          onClick={() => handleViewportClick('mobile')}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            activeViewport === 'mobile'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-white/[0.05] border-white/[0.08] text-white/60 hover:bg-white/[0.1] hover:text-white/90'
          }`}
          title='Mobile View (375x667)'
        >
          <Smartphone size={18} />
        </button>
        <button
          onClick={() => handleViewportClick('tablet')}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            activeViewport === 'tablet'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-white/[0.05] border-white/[0.08] text-white/60 hover:bg-white/[0.1] hover:text-white/90'
          }`}
          title='Tablet View (768x1024)'
        >
          <Tablet size={18} />
        </button>
        <button
          onClick={() => handleViewportClick('desktop')}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            activeViewport === 'desktop'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-white/[0.05] border-white/[0.08] text-white/60 hover:bg-white/[0.1] hover:text-white/90'
          }`}
          title='Desktop View'
        >
          <Monitor size={18} />
        </button>
      </div>
    </div>
  );
}
