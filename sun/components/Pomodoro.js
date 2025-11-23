
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { TimerMode } from '../types.js';

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

  // Enhanced Visualizer Logic
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
    
    // Math for organic wave
    // Faster movement when active
    const speed = isActive ? 0.05 : 0.01;
    timeRef.current += speed; 
    
    // Amplitude based on remaining time
    const totalTime = mode === TimerMode.FOCUS ? 25 * 60 : 5 * 60;
    const progress = timeLeft / totalTime;
    
    // Create multiple sine waves for organic feel
    const lines = 3;
    
    for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        
        const offset = i * 20;
        const amplitude = (height * 0.15) * progress + (i * 5); 
        const frequency = 0.01 + (i * 0.005);
        const phase = timeRef.current + i;

        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x++) {
          // Complex sine wave composition
          const y = (height / 2) + 
                    Math.sin(x * frequency + phase) * amplitude + 
                    Math.cos(x * 0.03 + phase * 0.5) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }

        // Stroke styling
        ctx.strokeStyle = mode === TimerMode.FOCUS 
            ? `rgba(18, 18, 18, ${0.1 + (i * 0.1)})` 
            : `rgba(230, 81, 0, ${0.1 + (i * 0.1)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [timeLeft, mode, isActive]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  return (
    <div className="h-full flex flex-col justify-between relative overflow-hidden p-8 group">
        <div className="flex justify-between items-start z-10">
             <span className="font-mono text-xs uppercase tracking-widest text-stone-400">
                {mode === TimerMode.FOCUS ? 'Deep Work' : 'Rest Cycle'}
            </span>
             <button onClick={switchMode} className="hover:text-accent transition-colors">
                <RefreshCw size={14} />
             </button>
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="z-10 text-center relative py-12">
            <motion.h1 
                className="text-8xl md:text-[10rem] leading-none font-serif font-light tracking-tighter text-ink mix-blend-multiply"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={mode} // Re-animate on mode switch
            >
                {formatTime(timeLeft)}
            </motion.h1>
            
            <div className="flex justify-center gap-4 mt-8">
                <button 
                    onClick={toggleTimer}
                    className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
                    data-magnetic
                >
                    {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <button 
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-ink hover:border-ink transition-all duration-300"
                    data-magnetic
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        <div className="z-10 text-center">
             <motion.div
                animate={{ opacity: isActive ? 1 : 0.5 }}
                className="inline-block"
             >
                <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                    {isActive ? '— Flow State Active —' : 'Ready'}
                </p>
            </motion.div>
        </div>
    </div>
  );
};
