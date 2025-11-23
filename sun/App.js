
import React from 'react';
import { CustomCursor } from './components/CustomCursor.js';
import { Pomodoro } from './components/Pomodoro.js';
import { TodoList } from './components/TodoList.js';
import { Journal } from './components/Journal.js';
import { motion } from 'framer-motion';

const Card: React.FC<{ 
    children: React.ReactNode; 
    className?: string;
    delay?: number;
}> = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] }}
    className={`bg-white/80 backdrop-blur-sm border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-sm overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  return (
    <div className="min-h-screen p-6 md:p-12 selection:bg-accent selection:text-white">
      <CustomCursor />
      
      <header className="mb-16 flex justify-between items-end max-w-[1600px] mx-auto">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
        >
            <h1 className="font-serif text-5xl md:text-7xl mb-1 text-ink tracking-tight">MindFlow.</h1>
            <p className="font-mono text-xs text-accent tracking-[0.2em] uppercase pl-1">
                Digital Sanctuary
            </p>
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden md:block text-right"
        >
             <p className="font-mono text-[10px] text-stone-400 tracking-widest uppercase">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
        </motion.div>
      </header>

      {/* Grid Layout inspired by Groth Studio Bento Grids */}
      <main className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(300px,auto)] gap-6 max-w-[1600px] mx-auto">
        
        {/* Main Feature: Pomodoro */}
        <div className="col-span-1 md:col-span-7 row-span-2 relative min-h-[500px]">
             <Card className="h-full">
                <Pomodoro />
             </Card>
        </div>

        {/* Side Feature: ToDo */}
        <div className="col-span-1 md:col-span-5 row-span-1 min-h-[400px]">
             <Card className="h-full" delay={0.1}>
                <TodoList />
             </Card>
        </div>

        {/* Bottom Feature: Journal */}
        <div className="col-span-1 md:col-span-5 row-span-1 min-h-[300px]">
             <Card className="h-full" delay={0.2}>
                <Journal />
             </Card>
        </div>
        
      </main>
      
      <footer className="mt-16 flex justify-between items-center text-stone-300 font-mono text-[10px] uppercase tracking-widest border-t border-stone-200/50 pt-8 max-w-[1600px] mx-auto">
        <span>© {new Date().getFullYear()} MindFlow System</span>
        <span className="hidden md:inline hover:text-accent transition-colors cursor-help">Breath In. Breath Out.</span>
      </footer>
    </div>
  );
};

export default App;
