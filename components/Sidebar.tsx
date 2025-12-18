'use client';

import { useState, useEffect } from 'react';

interface SiteLink {
  name: string;
  url: string;
  icon: string;
}

const sites: SiteLink[] = [
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
  { name: 'Reddit', url: 'https://reddit.com', icon: '🔮' },
];

export default function Sidebar() {
  const [activeUrl, setActiveUrl] = useState<string>('https://www.google.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [hudVisible, setHudVisible] = useState<boolean>(true);

  useEffect(() => {
    // Check HUD visibility state
    const checkHudState = async () => {
      if (typeof window !== 'undefined' && window.api) {
        const state = await window.api.getHudState();
        if (state) setHudVisible(state.hudVisible);
      }
    };
    checkHudState();

    // Poll for HUD state changes
    const interval = setInterval(checkHudState, 500);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = async (url: string) => {
    if (typeof window === 'undefined' || !window.api) {
      console.error('Electron API not available');
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.setUrl(url);
      if (result.success) {
        setActiveUrl(url);
      } else {
        console.error('Failed to load URL:', result.error);
      }
    } catch (error) {
      console.error('Error navigating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hudVisible) return null;

  return (
    <aside className='fixed top-[52px] right-0 w-[320px] h-[calc(100vh-52px)] bg-white/70 backdrop-blur-2xl border-l border-gray-200/50 flex flex-col shadow-2xl z-40 sidebar-grain'>
      {/* Header */}
      <div className='p-6 border-b border-gray-200/50'>
        <h1 className='text-xl font-bold text-gray-900 tracking-tight'>
          Usably
        </h1>
        <p className='text-xs text-gray-500 mt-1 font-medium'>
          Quick Navigation
        </p>
      </div>

      {/* Navigation Links */}
      <nav className='flex-1 p-4 overflow-y-auto'>
        <ul className='space-y-2'>
          {sites.map((site) => (
            <li key={site.url}>
              <button
                onClick={() => handleNavigation(site.url)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                  activeUrl === site.url
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : 'hover:bg-gray-100/70 text-gray-700 hover:text-gray-900 hover:scale-[1.01]'
                } ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className='text-2xl'>{site.icon}</span>
                <span className='font-semibold text-sm'>{site.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-gray-200/50'>
        <div className='text-xs text-gray-500 text-center font-medium'>
          {loading ? (
            <span className='flex items-center justify-center gap-2'>
              <span className='animate-spin'>⏳</span> Loading...
            </span>
          ) : (
            <span className='flex items-center justify-center gap-2'>
              <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
              Ready
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
