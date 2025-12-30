'use client';

import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  StopCircle,
  ArrowLeft,
  MousePointerClick,
  MousePointer2,
  Clock,
  Keyboard,
  Scroll,
  AlertCircle,
  Eye,
} from 'lucide-react';
import ShinyText from './ShinyText';
import GradualBlur from './GradualBlur';
import ColorBends from './ColorBends';
import PrismaticBurst from './PrismaticBurst';

interface AgentBarProps {
  isRunning: boolean;
  isFinished?: boolean;
  thoughts: { text: string; image?: string; type?: string }[];
  currentThought: string;
  onStop?: () => void;
  onBack?: () => void;
  pendingGeminiRequest?: boolean;
  onGeminiConfirm?: (confirmed: boolean) => void;
}

const getIconForType = (type?: string) => {
  switch (type) {
    case 'click':
      return (
        <MousePointerClick className='w-4 h-4 mt-0.5 text-blue-400 shrink-0' />
      );
    case 'moveCursor':
      return (
        <MousePointer2 className='w-4 h-4 mt-0.5 text-purple-400 shrink-0' />
      );
    case 'type':
      return <Keyboard className='w-4 h-4 mt-0.5 text-yellow-400 shrink-0' />;
    case 'wait':
      return <Clock className='w-4 h-4 mt-0.5 text-gray-400 shrink-0' />;
    case 'scroll':
      return <Scroll className='w-4 h-4 mt-0.5 text-orange-400 shrink-0' />;
    case 'finish':
    case 'success':
      return (
        <CheckCircle2 className='w-4 h-4 mt-0.5 text-green-500/70 shrink-0' />
      );
    case 'fail':
      return <AlertCircle className='w-4 h-4 mt-0.5 text-red-500 shrink-0' />;
    case 'analysis':
      return <Eye className='w-4 h-4 mt-0.5 text-cyan-400 shrink-0' />;
    default:
      return (
        <CheckCircle2 className='w-4 h-4 mt-0.5 text-green-500/70 shrink-0' />
      );
  }
};

export default function AgentBar({
  isRunning,
  isFinished = false,
  thoughts,
  currentThought,
  onStop,
  onBack,
  pendingGeminiRequest = false,
  onGeminiConfirm,
}: AgentBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts, currentThought]);

  return (
    <div className='h-full flex z-50 relative'>
      {/* Content Panel */}
      <div className='flex-1 w-64 flex flex-col relative'>
        {/* Header */}
        <div className='pt-8 py-2 px-2 flex items-center justify-between rounded-2xl bg-black/20 backdrop-blur-md mb-2'>
          <h2 className='text-lg text-white/70 ml-2'>Wicks</h2>
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
              className='flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-300'
            >
              <div className='flex items-start gap-3 text-white/60'>
                {getIconForType(thought.type)}
                <span className='leading-relaxed'>{thought.text}</span>
              </div>
              {thought.image && (
                <div className='ml-7 rounded-lg overflow-hidden border border-white/10'>
                  <img
                    src={`data:image/png;base64,${thought.image}`}
                    alt='Analysis context'
                    className='w-full h-auto opacity-80 hover:opacity-100 transition-opacity'
                  />
                </div>
              )}
            </div>
          ))}

          {currentThought && (
            <div className='flex items-start gap-3 text-white/90 bg-white/5 p-3 rounded-xl border border-white/5'>
              <ShinyText text={currentThought} speed={1.6} disabled={false} />
            </div>
          )}
        </div>

        {/* Stop Button */}
        <div className='pt-2'>
          <button
            onClick={onStop}
            className='w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 group'
          >
            <StopCircle className='w-4 h-4 group-hover:scale-110 transition-transform' />
            <span className='font-medium text-sm'>
              {isRunning ? 'Stop Agent' : 'Close'}
            </span>
          </button>
          {isFinished && onBack && (
            <button
              onClick={onBack}
              className='w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all duration-200 group mt-2'
            >
              <ArrowLeft className='w-4 h-4 group-hover:scale-110 transition-transform' />
              <span className='font-medium text-sm'>Back</span>
            </button>
          )}
          {pendingGeminiRequest && (
            <div className='mt-2 space-y-2'>
              <div className='p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs text-center'>
                Ready to send request to Gemini?
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => onGeminiConfirm?.(true)}
                  className='flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 transition-all duration-200 text-xs font-medium'
                >
                  Continue
                </button>
                <button
                  onClick={() => onGeminiConfirm?.(false)}
                  className='flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 text-xs font-medium'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
