import React from 'react';
import { CustomCursor } from './components/CustomCursor';
import { Pomodoro } from './components/Pomodoro';
import { TodoList } from './components/TodoList';
import { Journal } from './components/Journal';
import { motion } from 'framer-motion';

const Card: React.FC<{ 
    children: React.ReactNode; 
    className?: string;
    delay?: number;
}> = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={`bg-white border border-stone-200 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper p-4 md:p-8 selection:bg-accent selection:text-white">
      <CustomCursor />
      
      <header className="mb-12 flex justify-between items-end">
        <div>
            <h1 className="font-serif text-4xl md:text-5xl mb-2 text-ink">MindFlow.</h1>
            <p className="font-mono text-xs md:text-sm text-stone-500 tracking-wide">
                DIGITAL SANCTUARY v1.0
            </p>
        </div>
        <div className="hidden md:block text-right">
             <p className="font-mono text-xs text-stone-400">DESIGNED FOR FOCUS</p>
        </div>
      </header>

      {/* Grid Layout inspired by Groth Studio Bento Grids */}
      <main className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto gap-4 md:gap-6 max-w-[1600px] mx-auto h-auto md:h-[80vh]">
        
        {/* Main Feature: Pomodoro */}
        <div className="col-span-1 md:col-span-7 row-span-2 relative h-[500px] md:h-auto">
             <Card className="h-full">
                <Pomodoro />
             </Card>
        </div>

        {/* Side Feature: ToDo */}
        <div className="col-span-1 md:col-span-5 row-span-1 h-[400px] md:h-auto">
             <Card className="h-full" delay={0.1}>
                <TodoList />
             </Card>
        </div>

        {/* Bottom Feature: Journal */}
        <div className="col-span-1 md:col-span-5 row-span-1 h-[300px] md:h-auto">
             <Card className="h-full" delay={0.2}>
                <Journal />
             </Card>
        </div>
        
      </main>
      
      <footer className="mt-12 flex justify-between items-center text-stone-400 font-mono text-[10px] uppercase tracking-widest border-t border-stone-200 pt-4">
        <span>© {new Date().getFullYear()} MindFlow System</span>
        <span className="hidden md:inline">Breath In. Breath Out.</span>
      </footer>
    </div>
  );
};

export default App;