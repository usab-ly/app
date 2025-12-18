'use client';

import { useState, useEffect } from 'react';

export default function TitleBar() {
  const [currentUrl, setCurrentUrl] = useState<string>(
    'https://www.google.com'
  );
  const [hudVisible, setHudVisible] = useState<boolean>(true);

  useEffect(() => {
    // Poll for URL updates
    const interval = setInterval(async () => {
      if (typeof window !== 'undefined' && window.api) {
        const url = await window.api.getUrl();
        if (url) setCurrentUrl(url);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleHud = async () => {
    if (typeof window !== 'undefined' && window.api) {
      const result = await window.api.toggleHud();
      if (result) {
        setHudVisible(result.hudVisible);
      }
    }
  };

  return (
    <div className='titlebar h-[52px] bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 relative z-50'>
      {/* Left: Traffic light space */}
      <div className='w-20 h-full flex items-center pl-2'>
        {/* macOS traffic lights will appear here automatically */}
      </div>

      {/* Center: URL Display */}
      <div className='flex-1 flex items-center justify-center px-4'>
        <div className='max-w-2xl w-full bg-gray-100/50 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600 truncate text-center font-medium border border-gray-200/50 shadow-sm'>
          {currentUrl}
        </div>
      </div>

      {/* Right: Toggle Button */}
      <div className='w-20 flex items-center justify-end'>
        <button
          onClick={toggleHud}
          className='p-2 rounded-lg hover:bg-gray-200/50 transition-all duration-200 group'
          title={hudVisible ? 'Hide HUD (Full Screen)' : 'Show HUD'}
        >
          {hudVisible ? (
            <svg
              className='w-5 h-5 text-gray-600 group-hover:text-gray-900'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          ) : (
            <svg
              className='w-5 h-5 text-gray-600 group-hover:text-gray-900'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16m-7 6h7'
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
