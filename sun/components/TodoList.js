
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check } from 'lucide-react';
import { Todo } from '../types.js';

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Define the problem space', completed: false },
    { id: '2', text: 'Research visual references', completed: true },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-serif text-3xl italic text-ink">Priorities</h2>
        <span className="font-mono text-[10px] tracking-widest text-stone-400">{todos.filter(t => !t.completed).length} TASKS</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`group flex items-center justify-between p-3 border-b border-stone-100 hover:bg-stone-50 transition-colors ${todo.completed ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${todo.completed ? 'bg-ink border-ink' : 'border-stone-300 hover:border-accent'}`}
                >
                  {todo.completed && <Check size={10} className="text-white" />}
                </button>
                <span className={`font-sans text-sm tracking-wide ${todo.completed ? 'line-through decoration-stone-300' : 'text-ink'}`}>
                  {todo.text}
                </span>
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-500">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={addTodo} className="mt-6 relative">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-transparent border-b border-stone-200 py-3 pr-10 font-sans text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-stone-300"
        />
        <button type="submit" className="absolute right-0 top-3 text-stone-300 hover:text-ink transition-colors">
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
};
