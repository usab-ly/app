import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

interface KeyboardControlProps {
  onKeyPress: (key: string) => void;
}

export default function KeyboardControl({ onKeyPress }: KeyboardControlProps) {
  const [lastKeys, setLastKeys] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key;
      setLastKeys((prev) => [...prev.slice(-4), key]);
      onKeyPress(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, onKeyPress]);

  return (
    <div className='flex flex-col items-center gap-4 p-4 bg-gray-900/80 backdrop-blur-md rounded-xl border border-white/10 text-white w-fit h-fit my-auto mt-2'>
      <div className='flex items-center gap-2 mb-2'>
        <Keyboard size={20} />
        <span className='font-medium'>Keyboard</span>
      </div>

      <button
        onClick={() => setIsCapturing(!isCapturing)}
        className={`px-4 py-2 rounded-lg transition-colors w-full text-sm ${
          isCapturing
            ? 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30'
            : 'bg-white/5 hover:bg-white/10 border border-white/10'
        }`}
      >
        {isCapturing ? 'Stop Capturing' : 'Capture Keys'}
      </button>

      <div className='flex gap-2 min-h-[40px] items-center justify-center bg-black/20 rounded-lg p-2 w-full border border-white/5'>
        {lastKeys.length === 0 ? (
          <span className='text-gray-500 text-xs'>No keys typed</span>
        ) : (
          lastKeys.map((k, i) => (
            <span
              key={i}
              className='px-2 py-1 bg-white/10 rounded text-xs font-mono min-w-[20px] text-center'
            >
              {k === ' ' ? '␣' : k}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
