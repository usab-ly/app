'use client';

import { useState, useEffect } from 'react';

interface SiteLink {
  name: string;
  url: string;
  icon: string;
}

const quickLinks: SiteLink[] = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
  { name: 'Photos', url: 'https://photos.google.com', icon: '🖼️' },
  { name: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖' },
  { name: 'Notion', url: 'https://notion.so', icon: '📝' },
  { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
];

const tabs: SiteLink[] = [
  { name: 'Google', url: 'https://www.google.com', icon: 'G' },
];

interface SidebarProps {
  onNavigate?: (url: string) => void;
  currentUrl?: string;
}

export default function Sidebar({
  onNavigate,
  currentUrl = 'https://www.google.com',
}: SidebarProps) {
  const [activeUrl, setActiveUrl] = useState<string>(currentUrl);
  const [loading, setLoading] = useState<boolean>(false);
  const [hudVisible, setHudVisible] = useState<boolean>(true);

  useEffect(() => {
    setActiveUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    const checkHudState = async () => {
      if (typeof window !== 'undefined' && window.api) {
        const state = await window.api.getHudState();
        if (state) setHudVisible(state.hudVisible);
      }
    };
    checkHudState();
    const interval = setInterval(checkHudState, 500);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = async (url: string) => {
    setLoading(true);
    try {
      if (onNavigate) {
        onNavigate(url);
        setActiveUrl(url);
      } else if (typeof window !== 'undefined' && window.api) {
        // Fallback to IPC if no callback provided (though we are moving away from this)
        const result = await window.api.setUrl(url);
        if (result.success) setActiveUrl(url);
      }
    } catch (error) {
      console.error('Error navigating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hudVisible) return null;

  return (
    <aside className='w-[210px] h-screen flex flex-col text-white/90 transition-all duration-300 sidebar-grain'>
      {/* Header Area */}
      <div className='pt-5 px-4 pb-4 flex flex-col gap-4 titlebar'>
        {/* Traffic Lights Spacer */}
        <div className='h-4 w-full' />

        {/* URL / Search Bar */}
        <div className='bg-white/10 hover:bg-white/15 transition-colors rounded-lg p-2.5 flex items-center gap-2 text-sm cursor-text no-drag group border border-white/5 shadow-inner'>
          <span className='opacity-50 text-xs'>🔒</span>
          <span className='truncate flex-1 text-white/80 text-xs font-medium tracking-wide'>
            {
              activeUrl
                .replace('https://www.', '')
                .replace('https://', '')
                .split('/')[0]
            }
          </span>
          <button
            onClick={() => handleNavigation(activeUrl)}
            className='opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity'
          >
            <span className='text-xs'>↻</span>
          </button>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className='px-4 grid grid-cols-3 gap-2 mb-6'>
        {quickLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => handleNavigation(link.url)}
            className='aspect-square rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl transition-all hover:scale-105 border border-white/5'
            title={link.name}
          >
            {link.icon}
          </button>
        ))}
      </div>

      {/* Tabs Section */}
      <div className='flex-1 px-3 overflow-y-auto'>
        <div className='flex items-center justify-between px-2 mb-2'>
          <span className='text-xs font-medium text-white/40 uppercase tracking-wider'>
            Personal
          </span>
          <button className='text-white/20 hover:text-white/60 transition-colors'>
            +
          </button>
        </div>

        <div className='space-y-1'>
          <button className='w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/90 transition-all flex items-center gap-2 group'>
            <span className='text-lg'>+</span>
            <span className='text-sm font-medium'>New Tab</span>
          </button>

          {tabs.map((tab) => (
            <button
              key={tab.url}
              onClick={() => handleNavigation(tab.url)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group ${
                activeUrl.includes(tab.url.replace('https://www.', ''))
                  ? 'bg-white/10 text-white shadow-sm border border-white/5'
                  : 'hover:bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <span className='text-sm opacity-80'>{tab.icon}</span>
              <span className='text-sm font-medium truncate'>{tab.name}</span>
              {loading &&
                activeUrl.includes(tab.url.replace('https://www.', '')) && (
                  <span className='ml-auto w-2 h-2 bg-white rounded-full animate-pulse' />
                )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className='p-4 flex justify-between items-center text-white/30 border-white/5'>
        <button className='hover:text-white/80 transition-colors'>⚙️</button>
        <button className='hover:text-white/80 transition-colors'>👤</button>
      </div>
    </aside>
  );
}
