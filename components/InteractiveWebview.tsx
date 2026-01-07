import React, { RefObject } from 'react';
import Aurora from '@/components/Aurora';

interface InteractiveWebviewProps {
  webviewRef: RefObject<any>;
  currentUrl: string;
  viewportSize: { width: string | number; height: string | number };
}

const InteractiveWebview: React.FC<InteractiveWebviewProps> = ({
  webviewRef,
  currentUrl,
  viewportSize,
}) => {
  return (
    <div className='w-full h-full flex items-center justify-center overflow-hidden relative'>
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
        <div className='absolute w-full h-full inset-0 z-1 opacity-70'>
          <Aurora
            colorStops={['#68c1ee', '#68c1ee', '#68c1ee', '#68c1ee']}
            blend={1}
            amplitude={0.2}
            speed={3}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveWebview;
