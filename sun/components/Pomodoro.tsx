import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { TimerMode } from '../types';

export const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === TimerMode.FOCUS ? 25 * 60 : 5 * 60);
  };

  const switchMode = () => {
    const newMode = mode === TimerMode.FOCUS ? TimerMode.BREAK : TimerMode.FOCUS;
    setMode(newMode);
    setTimeLeft(newMode === TimerMode.FOCUS ? 25 * 60 : 5 * 60);
    setIsActive(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Visualizer Logic
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Math for wave
    timeRef.current += 0.02; // speed
    
    // Amplitude reduces as timer finishes
    const totalTime = mode === TimerMode.FOCUS ? 25 * 60 : 5 * 60;
    const progress = timeLeft / totalTime;
    const baseAmplitude = height * 0.2 * progress; 
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    const frequency = mode === TimerMode.FOCUS ? 0.02 : 0.05; // Faster wave during break

    for (let x = 0; x < width; x++) {
      const y = height / 2 + 
                Math.sin(x * frequency + timeRef.current) * baseAmplitude +
                Math.sin(x * 0.01 + timeRef.current * 0.5) * (baseAmplitude * 0.5); // Secondary wave
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = mode === TimerMode.FOCUS ? '#121212' : '#E65100';
    ctx.lineWidth = 2;
    ctx.stroke();

    requestRef.current = requestAnimationFrame(animate);
  }, [timeLeft, mode]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  return (
    <div className="h-full flex flex-col justify-between relative overflow-hidden p-6 group">
        <div className="flex justify-between items-start z-10">
             <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                {mode === TimerMode.FOCUS ? 'Deep Work' : 'Decompress'}
            </span>
             <button onClick={switchMode} className="hover:text-accent transition-colors">
                <RefreshCw size={16} />
             </button>
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="z-10 text-center relative">
            <motion.h1 
                className="text-8xl md:text-9xl font-serif font-light tracking-tighter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {formatTime(timeLeft)}
            </motion.h1>
            
            <div className="flex justify-center gap-6 mt-8">
                <button 
                    onClick={toggleTimer}
                    className="w-16 h-16 rounded-full border border-ink flex items-center justify-center hover:bg-ink hover:text-white transition-all duration-300"
                >
                    {isActive ? <Pause /> : <Play className="ml-1" />}
                </button>
                <button 
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-full border border-transparent hover:border-ink flex items-center justify-center text-stone-400 hover:text-ink transition-all duration-300"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        <div className="z-10 text-center">
            <p className="font-mono text-xs text-stone-500">
                {isActive ? 'Flow state active' : 'Ready to begin'}
            </p>
        </div>
    </div>
  );
};