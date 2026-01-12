import React, { useState } from 'react';
import { Menu, X, Phone, MessageCircle, Globe } from 'lucide-react';
import { html } from 'htm/react';
import { PHONE_NUMBER, WHATSAPP_NUMBER, LOGO_URL } from './constants.js';

const Navbar = ({ lang, setLang, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleWhatsApp = () => {
    // Universal WhatsApp link using api.whatsapp.com for better mobile support
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent("Hi, I want to book a cab.")}`, '_blank');
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' }
  ];

  return html`
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <!-- Logo -->
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src=${LOGO_URL} 
              alt="Om Sai Travels" 
              className="h-12 w-auto object-contain transform group-hover:scale-105 transition-transform"
              width="48"
              height="48"
              fetchpriority="high"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-gray-900 leading-none tracking-tight font-sans">OM SAI</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Travels</span>
            </div>
          </a>

          <!-- Desktop Menu -->
          <div className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">${t.nav.home}</a>
            <a href="#services" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">${t.nav.services}</a>
            <a href="#fleet" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">${t.nav.fleet}</a>
            <a href="#benefits" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">${t.nav.pricing}</a>

            <!-- Language Switcher -->
            <div className="relative">
              <button 
                onClick=${() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 text-gray-600 hover:text-brand-500 font-medium text-sm px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
              >
                <${Globe} size=${16} />
                <span className="uppercase">${lang}</span>
              </button>
              
              ${langMenuOpen && html`
                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 animate-fade-up">
                  ${languages.map(l => html`
                    <button 
                      key=${l.code}
                      onClick=${() => { setLang(l.code); setLangMenuOpen(false); }}
                      className=${`block w-full text-left px-4 py-2 text-sm hover:bg-brand-50 hover:text-brand-600 ${lang === l.code ? 'font-bold text-brand-600 bg-brand-50' : 'text-gray-600'}`}
                    >
                      ${l.label}
                    </button>
                  `)}
                </div>
              `}
            </div>
            
            <div className="h-6 w-px bg-gray-200"></div>
            
            <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
               <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
            </a>
            
            <a 
              href=${`tel:${PHONE_NUMBER}`}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <${Phone} size=${16} /> ${PHONE_NUMBER}
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <div className="md:hidden flex items-center gap-4">
             <!-- Mobile Lang Switch -->
             <button 
                onClick=${() => {
                  const next = lang === 'en' ? 'hi' : (lang === 'hi' ? 'mr' : 'en');
                  setLang(next);
                }}
                className="flex items-center gap-1 text-gray-600 font-bold text-xs uppercase border border-gray-200 px-2 py-1 rounded"
              >
                ${lang}
              </button>

            <button
              onClick=${() => setIsOpen(!isOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none transition-colors"
            >
              ${isOpen ? html`<${X} size=${24} />` : html`<${Menu} size=${24} />`}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div className=${`md:hidden absolute w-full bg-white border-b border-gray-100 shadow-xl transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-6 space-y-4">
          <a href="#home" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">${t.nav.home}</a>
          <a href="#services" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">${t.nav.services}</a>
          <a href="#fleet" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">${t.nav.fleet}</a>
           <a href="#benefits" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">${t.nav.pricing}</a>
           
           <div className="pt-4 mt-4 border-t border-gray-100 flex justify-center">
              <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
               <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-12" />
            </a>
           </div>
        </div>
      </div>
    </nav>
  `;
};

export default Navbar;