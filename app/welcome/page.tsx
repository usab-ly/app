'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  ChevronRight,
  Bot,
  Zap,
  MousePointerClick,
  FileText,
  BarChart3,
  Cherry,
  ChevronLeft,
} from 'lucide-react';
import CurvedLoop from '@/components/CurvedLoop';
import Image from 'next/image';
import PrismaticBurst from '@/components/PrismaticBurst';
import GridDistortion from '@/components/GridDistortion';
import { motion, AnimatePresence } from 'framer-motion';
import Magnet from '@/components/Magnet';

const MotionCherry = motion(Cherry);

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      id: 'intro',
      title: 'Cherri',
      subtitle: '',
      icon: <Bot className='w-12 h-12 text-orange-500' />,
      image: (
        <div className='relative w-full h-64 bg-linear-to-br from-orange-100 to-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center overflow-hidden shadow-inner'>
          <div className='absolute inset-0 opacity-30'>
            <div className='absolute top-10 left-10 w-20 h-20 bg-orange-400 rounded-full blur-xl animate-pulse' />
            <div className='absolute bottom-10 right-10 w-32 h-32 bg-purple-400 rounded-full blur-xl animate-pulse delay-700' />
          </div>
          <div className='z-10 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 transform rotate-[-5deg] transition-transform hover:rotate-0 duration-500'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-8 h-8 rounded-full bg-white flex items-center justify-center text-white font-bold'>
                <Cherry
                  className='w-5 h-5 text-rose-500 fill-rose-500/10'
                  strokeWidth={1.5}
                />
              </div>
              <div className='h-2 w-20 bg-gray-200 rounded-full' />
            </div>
            <div className='space-y-2'>
              <div className='h-2 w-32 bg-gray-100 rounded-full' />
              <div className='h-2 w-24 bg-gray-100 rounded-full' />
              <div className='h-2 w-28 bg-gray-100 rounded-full' />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Automated User Journeys',
      subtitle:
        'Detect friction points, excessive clicks, and broken flows automatically as AI navigates your site.',
      icon: <Zap className='w-12 h-12 text-purple-500' />,
      image: (
        <div className='relative w-full h-64 bg-linear-to-br from-purple-100 to-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center overflow-hidden shadow-inner'>
          <div className='grid grid-cols-2 gap-4 p-6 w-full max-w-xs'>
            <div className='bg-white p-4 rounded-xl shadow-sm border border-purple-100 transform hover:-translate-y-1 transition-transform duration-300'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg mb-2 flex items-center justify-center'>
                <MousePointerClick className='w-4 h-4 text-blue-600' />
              </div>
              <div className='h-2 w-16 bg-gray-100 rounded-full mb-1' />
              <div className='h-1.5 w-10 bg-gray-100 rounded-full' />
            </div>
            <div className='bg-white p-4 rounded-xl shadow-sm border border-purple-100 transform hover:-translate-y-1 transition-transform duration-300 delay-100'>
              <div className='w-8 h-8 bg-orange-100 rounded-lg mb-2 flex items-center justify-center'>
                <FileText className='w-4 h-4 text-orange-600' />
              </div>
              <div className='h-2 w-16 bg-gray-100 rounded-full mb-1' />
              <div className='h-1.5 w-10 bg-gray-100 rounded-full' />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Smart Scoring & Analytics',
      subtitle:
        'Get detailed usability scores and quality metrics to benchmark your user experience.',
      icon: <BarChart3 className='w-12 h-12 text-blue-500' />,
      image: (
        <div className='relative w-full h-64 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center overflow-hidden shadow-inner'>
          <div className='relative w-48 h-48'>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-32 h-32 rounded-full border-8 border-blue-200 border-t-blue-500 transform -rotate-45' />
            </div>
            <div className='absolute inset-0 flex items-center justify-center flex-col'>
              <span className='text-3xl font-bold text-slate-800'>92</span>
              <span className='text-xs text-slate-500 uppercase tracking-wider font-semibold'>
                Score
              </span>
            </div>
            <div className='absolute bottom-4 right-0 bg-white p-3 rounded-lg shadow-sm border border-blue-100 animate-bounce'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-green-500' />
                <span className='text-xs font-medium text-slate-600'>
                  +15% vs last week
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'signin',
      title: 'Ready to Optimize?',
      subtitle:
        'Generate actionable improvement tasks and code-level fixes instantly.',
      icon: <Cherry className='w-12 h-12 text-rose-400' />,
      image: null,
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!mounted) return null;

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key='splash'
            className='fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden rounded-bl-4xl rounded-tr-4xl'
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 w-full h-full opacity-60'>
              {/* <PrismaticBurst /> */}
              <GridDistortion
                imageSrc='/images/bgimage.jpg'
                grid={20}
                mouse={0.5}
                strength={0.15}
                relaxation={0.9}
                className='custom-class'
              />
            </div>
            <div className='relative z-10 flex flex-col items-center justify-center'>
              <div className='relative'>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className='absolute inset-0 bg-rose-500/30 blur-3xl rounded-full'
                />
                <MotionCherry
                  layoutId='cherry-logo'
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className='w-32 h-32 text-rose-500 relative z-10 drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <div className='h-full bg-white backdrop-blur-xl relative overflow-hidden font-sans text-slate-900 selection:bg-orange-100 flex flex-col md:flex-row rounded-bl-4xl rounded-tr-4xl mb-10'>
          {/* Background Ambient Animation */}
          <div className='absolute inset-0 overflow-hidden pointer-events-none z-0'>
            <div className='absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-200/20 blur-[100px] animate-blob' />
            <div className='absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-200/20 blur-[100px] animate-blob animation-delay-2000' />
            <div className='absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-200/20 blur-[100px] animate-blob animation-delay-4000' />
          </div>
          {/* Left Side - Visuals */}
          <div
            className={cn(
              'w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center transition-colors duration-500 relative z-10 md:[clip-path:polygon(0%_0%,93%_0%,100%_50%,93%_100%,0%_100%)]',
              step === 0
                ? 'bg-red-400/20'
                : step === 1
                  ? 'bg-purple-50/50'
                  : step === 2
                    ? 'bg-blue-50/50'
                    : ''
            )}
          >
            <div className='w-full max-w-sm mx-auto transition-all duration-500 transform'>
              {currentStep.image ? (
                <div className='animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4'>
                  {currentStep.image}
                </div>
              ) : (
                <div className='w-full h-64 flex items-center justify-center animate-in fade-in zoom-in duration-700'>
                  <div className='relative'>
                    <div className='absolute inset-0 bg-greenrounded-full blur-2xl opacity-40 animate-pulse' />
                    <Cherry className='w-64 h-64 text-rose-400 relative z-10' />
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Dots */}
            <div className='flex gap-2 mt-12'>
              {step < steps.length - 1 &&
                steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      i === step ? 'w-8 bg-slate-800' : 'w-2 bg-slate-500/20'
                    )}
                  />
                ))}
            </div>
          </div>

          {/* Right Side - Content */}
          <div className='w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 '>
            <div className='absolute top-8 right-8'>
              {step < steps.length - 1 && (
                <button
                  onClick={() => setStep(steps.length - 1)}
                  className='text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors'
                >
                  Skip
                </button>
              )}
            </div>

            <div
              key={step}
              className='animate-in fade-in slide-in-from-right-8 duration-500'
            >
              {currentStep.id === 'intro' ? (
                <div className='flex justify-center items-center gap-3 px-4 py-2 bg-black/80 text-white rounded-full mb-4'>
                  <span className='text-7xl font-bold tracking-tight'>
                    {currentStep.title}
                  </span>

                  <MotionCherry
                    layoutId='cherry-logo'
                    className='w-20 h-20 text-rose-400'
                    strokeWidth={1.5}
                  />
                </div>
              ) : (
                <h1 className='text-4xl font-bold tracking-tight text-slate-900 mb-4'>
                  {currentStep.title}
                </h1>
              )}

              <p className='text-lg text-slate-500 leading-relaxed mb-8'>
                {currentStep.subtitle}
              </p>

              {step === steps.length - 1 ? (
                <div className='space-y-4 w-full max-w-xs'>
                  <button className='w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2'>
                    Create Account
                    <ArrowRight className='w-5 h-5' />
                  </button>
                  <button className='w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]'>
                    Sign In
                  </button>
                  <p className='text-xs text-center text-slate-400 mt-4'>
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Global step navigation arrows (entire window) */}
          <div className='absolute bottom-8 left-8 z-20'>
            {step > 0 && (
              <Magnet padding={100} disabled={false} magnetStrength={10}>
                <button
                  onClick={handlePrev}
                  aria-label='Previous step'
                  className='group h-12 w-12 rounded-full bg-white/70 backdrop-blur-3xl flex items-center justify-center transition'
                >
                  <ChevronLeft className='w-5 h-5 text-slate-700 group-hover:-translate-x-0.5 transition' />
                </button>
              </Magnet>
            )}
          </div>
          <div className='absolute bottom-8 right-8 z-20'>
            {step < steps.length - 1 && (
              <Magnet padding={100} disabled={false} magnetStrength={10}>
                <button
                  onClick={handleNext}
                  aria-label='Next step'
                  className='group h-12 w-12 rounded-full bg-gray-900/50 backdrop-blur-3xl flex items-center justify-center transition'
                >
                  <ChevronRight className='w-5 h-5 text-white group-hover:translate-x-0.5 transition' />
                </button>
              </Magnet>
            )}
          </div>

          <Image
            src='/images/bgimage.jpg'
            alt='image'
            className='w-full h-full absolute top-0 left-0 object-cover object-center opacity-30 pointer-events-none'
            width={100}
            height={100}
          />
          <style jsx global>{`
            @keyframes blob {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              33% {
                transform: translate(30px, -50px) scale(1.1);
              }
              66% {
                transform: translate(-20px, 20px) scale(0.9);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
