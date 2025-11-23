import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { generateDailyPrompt } from '../services/geminiService';
import { JournalPrompt } from '../types';

export const Journal: React.FC = () => {
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load prompt on mount
    loadNewPrompt();
  }, []);

  const loadNewPrompt = async () => {
    setLoading(true);
    const data = await generateDailyPrompt();
    setPrompt(data);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-stone-100/50">
      <div className="flex justify-between items-start mb-6">
        <div>
           <h2 className="font-serif text-2xl italic flex items-center gap-2">
             Reflection
             <button 
                onClick={loadNewPrompt} 
                disabled={loading}
                className="text-stone-400 hover:text-accent transition-colors"
             >
                <Sparkles size={16} className={loading ? 'animate-spin-slow' : ''}/>
             </button>
           </h2>
        </div>
        <span className="font-mono text-xs text-stone-400">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</span>
      </div>

      <div className="mb-6">
        {loading ? (
             <div className="h-16 flex items-center text-stone-400 gap-2 font-mono text-xs">
                <Loader2 size={14} className="animate-spin" /> Generating thought...
             </div>
        ) : (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                    {prompt?.topic || "Loading..."}
                </h3>
                <p className="font-serif text-lg text-stone-700 leading-relaxed">
                    {prompt?.context}
                </p>
            </motion.div>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Clear your mind..."
        className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 font-sans text-stone-600 leading-7 placeholder:text-stone-300 text-sm p-0 custom-scrollbar"
        spellCheck={false}
      />
      
      <div className="flex justify-end mt-4">
        <button className="flex items-center gap-2 font-mono text-xs text-stone-400 hover:text-ink transition-colors">
            <Save size={14} /> SAVE ENTRY
        </button>
      </div>
    </div>
  );
};