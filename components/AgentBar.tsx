'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Sparkles, BrainCircuit, StopCircle } from 'lucide-react';
import ShinyText from './ShinyText';
import GradualBlur from './GradualBlur';
import ColorBends from './ColorBends';
import PrismaticBurst from './PrismaticBurst';

interface AgentBarProps {
  isRunning: boolean;
  thoughts: string[];
  currentThought: string;
  onStop?: () => void;
}

export default function AgentBar({
  isRunning,
  thoughts,
  currentThought,
  onStop,
}: AgentBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts, currentThought]);

  if (!isRunning) return null;

  return (
    <div className='h-full flex z-50 relative'>
      {/* Content Panel */}
      <div className='flex-1 w-64 flex flex-col relative'>
        {/* Header */}
        <div className='pt-8 py-2 px-2 flex items-center justify-between rounded-2xl bg-black/20 backdrop-blur-md mb-2'>
          <h2 className='text-lg text-white/70 ml-2'>Spencer</h2>
          <div className='relative rounded-full w-10 h-10 overflow-clip border border-amber-50'>
            <PrismaticBurst
              animationType='hover'
              intensity={2}
              speed={1}
              distort={10.0}
              paused={false}
              offset={{ x: 0, y: 0 }}
              hoverDampness={0.25}
              rayCount={0}
              mixBlendMode='lighten'
              colors={['#ff007a', '#4d3dff', '#ffffff']}
            />
          </div>
        </div>

        {/* Thoughts Log */}
        <div
          ref={scrollRef}
          className='flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs scrollbar-hide rounded-2xl backdrop-blur-sm border border-white/5 overflow-hidden'
        >
          {thoughts.map((thought, i) => (
            <div
              key={i}
              className='flex items-start gap-3 text-white/60 animate-in fade-in slide-in-from-left-2 duration-300'
            >
              <CheckCircle2 className='w-4 h-4 mt-0.5 text-green-500/70 shrink-0' />
              <span className='leading-relaxed'>{thought}</span>
            </div>
          ))}

          {currentThought && (
            <div className='flex items-start gap-3 text-white/90 bg-white/5 p-3 rounded-xl border border-white/5'>
              <ShinyText text={currentThought} speed={1.6} disabled={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
