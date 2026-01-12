import React, { useState } from 'react';
import { Menu, X, Phone, MessageCircle } from 'lucide-react';
import { html } from 'htm/react';
import { PHONE_NUMBER, WHATSAPP_NUMBER } from './constants.js';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I want to book a cab.`, '_blank');
  };

  return html`
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <!-- Logo -->
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center text-gray-900 font-bold text-xl shadow-sm transform group-hover:rotate-3 transition-transform">
              OS
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-gray-900 leading-none tracking-tight">OM SAI</span>
              <span className="text-xs text-gray-500 font-medium tracking-wide">Tour & Travels</span>
            </div>
          </a>

          <!-- Desktop Menu -->
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Home</a>
            <a href="#services" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Services</a>
            <a href="#fleet" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Our Fleet</a>
            
            <div className="h-6 w-px bg-gray-200"></div>
            
            <button 
              onClick=${handleWhatsApp}
              className="text-gray-600 hover:text-green-600 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <${MessageCircle} size=${18} /> WhatsApp
            </button>
            
            <a 
              href=${`tel:${PHONE_NUMBER}`}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <${Phone} size=${16} /> ${PHONE_NUMBER}
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <div className="md:hidden">
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
      <div className=${`md:hidden absolute w-full bg-white border-b border-gray-100 shadow-xl transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-6 space-y-4">
          <a href="#home" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">Home</a>
          <a href="#services" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">Services</a>
          <a href="#fleet" onClick=${() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-900 hover:bg-gray-50">Fleet</a>
        </div>
      </div>
    </nav>
  `;
};

export default Navbar;