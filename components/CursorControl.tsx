import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MousePointerClick,
  Crosshair,
} from 'lucide-react';
import { useState } from 'react';

interface CursorControlProps {
  onMove: (dx: number, dy: number) => void;
  onMoveTo: (x: number, y: number) => void;
  onClick: () => void;
}

export default function CursorControl({
  onMove,
  onMoveTo,
  onClick,
}: CursorControlProps) {
  const step = 20;
  const [x, setX] = useState('0');
  const [y, setY] = useState('0');

  const handleGo = () => {
    const numX = parseInt(x);
    const numY = parseInt(y);
    if (!isNaN(numX) && !isNaN(numY)) {
      onMoveTo(numX, numY);
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 p-4 bg-gray-900/80 backdrop-blur-md rounded-xl border border-white/10 text-white w-fit h-fit my-auto'>
      <div className='flex flex-col items-center gap-2'>
        <button
          onClick={() => onMove(0, -step)}
          className='p-2 hover:bg-white/10 rounded-lg transition-colors'
          title='Up'
        >
          <ArrowUp size={24} />
        </button>
        <div className='flex gap-2'>
          <button
            onClick={() => onMove(-step, 0)}
            className='p-2 hover:bg-white/10 rounded-lg transition-colors'
            title='Left'
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={onClick}
            className='p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/20'
            title='Click'
          >
            <MousePointerClick size={24} />
          </button>
          <button
            onClick={() => onMove(step, 0)}
            className='p-2 hover:bg-white/10 rounded-lg transition-colors'
            title='Right'
          >
            <ArrowRight size={24} />
          </button>
        </div>
        <button
          onClick={() => onMove(0, step)}
          className='p-2 hover:bg-white/10 rounded-lg transition-colors'
          title='Down'
        >
          <ArrowDown size={24} />
        </button>
      </div>

      <div className='w-full h-px bg-white/10' />

      <div className='flex flex-col gap-2 w-full'>
        <div className='flex gap-2 items-center'>
          <span className='text-xs text-gray-400 w-4'>X</span>
          <input
            type='number'
            value={x}
            onChange={(e) => setX(e.target.value)}
            className='w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500'
          />
        </div>
        <div className='flex gap-2 items-center'>
          <span className='text-xs text-gray-400 w-4'>Y</span>
          <input
            type='number'
            value={y}
            onChange={(e) => setY(e.target.value)}
            className='w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500'
          />
        </div>
        <button
          onClick={handleGo}
          className='flex items-center justify-center gap-2 w-full p-2 mt-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm'
        >
          <Crosshair size={16} />
          Go to
        </button>
      </div>
    </div>
  );
}
