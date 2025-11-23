
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Save, Loader2, PenLine } from 'lucide-react';
import { generateDailyPrompt } from '../services/geminiService.js';
import { JournalPrompt } from '../types.js';

export const Journal: React.FC = () => {
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNewPrompt();
  }, []);

  const loadNewPrompt = async () => {
    setLoading(true);
    const data = await generateDailyPrompt();
    setPrompt(data);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-[#F5F4EF]">
      <div className="flex justify-between items-start mb-6">
        <h2 className="font-serif text-3xl italic text-ink flex items-center gap-3">
           Thoughts
        </h2>
        <button 
            onClick={loadNewPrompt} 
            disabled={loading}
            className="text-stone-400 hover:text-accent transition-colors p-2"
            title="Generate new prompt"
         >
            <Sparkles size={16} className={loading ? 'animate-spin-slow' : ''}/>
         </button>
      </div>

      <div className="mb-6 min-h-[80px]">
        {loading ? (
             <div className="flex items-center text-stone-400 gap-2 font-mono text-xs animate-pulse">
                <Loader2 size={12} className="animate-spin" /> CONSULTING THE MUSE...
             </div>
        ) : (
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={prompt?.topic}
            >
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
                    {prompt?.topic}
                </h3>
                <p className="font-serif text-lg text-stone-800 leading-snug">
                    {prompt?.context}
                </p>
            </motion.div>
        )}
      </div>

      <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing here..."
            className="w-full h-full bg-transparent border-none resize-none focus:ring-0 font-sans text-stone-600 leading-relaxed placeholder:text-stone-300 text-sm p-0 custom-scrollbar"
            spellCheck={false}
          />
          <PenLine size={16} className="absolute bottom-0 right-0 text-stone-300 pointer-events-none" />
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-200/50">
        <span className="font-mono text-[10px] text-stone-400">{content.length} CHARS</span>
        <button className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-stone-400 hover:text-ink transition-colors">
            SAVE <Save size={12} />
        </button>
      </div>
    </div>
  );
};
