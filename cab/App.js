import React, { useState } from 'react';
import Navbar from './Navbar.js';
import FleetSection from './FleetSection.js';
import BookingForm from './BookingForm.js';
import { SERVICES_DATA, PHONE_NUMBER, WHATSAPP_NUMBER, TRANSLATIONS, DRIVERS } from './constants.js';
import { Phone, Check, Shield, Calculator, ArrowRight, MapPin, ChevronDown, ChevronUp, Star, AlertCircle, FileText } from 'lucide-react';
import { html } from 'htm/react';

function App() {
  const [lang, setLang] = useState('en');
  const [distance, setDistance] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);

  const t = TRANSLATIONS[lang];

  const calculateEstimate = () => {
    const dist = parseFloat(distance);
    if (isNaN(dist)) return;
    const min = Math.floor(dist * 18); 
    const max = Math.floor(dist * 24);
    setEstimatedCost(`₹${min} - ₹${max}`);
  };

  const toggleAccordion = (idx) => {
    setActiveAccordion(activeAccordion === idx ? null : idx);
  };

  return html`
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <${Navbar} lang=${lang} setLang=${setLang} t=${t} />

      <!-- Hero Section -->
      <div id="home" className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden bg-brand-50">
        <!-- Abstract Background Shape -->
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[400px] h-[400px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            <!-- Hero Content -->
            <div className="lg:col-span-7 mb-12 lg:mb-0 animate-fade-up">
              <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-900 text-xs font-bold uppercase tracking-wider mb-6 border border-brand-200">
                ${t.hero.badge}
              </span>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
                ${t.hero.title} <br />
                <span className="text-brand-600 underline decoration-brand-300 decoration-4 underline-offset-4">${t.hero.subtitle}</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                ${t.hero.desc}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#booking" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  ${t.hero.bookBtn}
                </a>
                <a href="#services" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                  ${t.hero.viewServices}
                </a>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <${Shield} className="w-5 h-5 text-green-500" /> ${t.hero.safe}
                </div>
                 <div className="flex items-center gap-2">
                  <${Check} className="w-5 h-5 text-green-500" /> ${t.hero.support}
                </div>
              </div>
            </div>

            <!-- Booking Form Container -->
            <div className="lg:col-span-5 animate-fade-up delay-200" id="booking">
              <${BookingForm} t=${t.booking} />
            </div>
          </div>
        </div>
      </div>

      <!-- Benefits Section (Why Choose Us) -->
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">${t.benefits.title}</h2>
            <h3 className="text-3xl font-extrabold text-gray-900">${t.benefits.subtitle}</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            ${t.benefits.items.map((benefit, idx) => html`
              <div key=${idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-300 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-600 mb-4">
                  <${benefit.icon} size=${24} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">${benefit.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">${benefit.desc}</p>
              </div>
            `)}
          </div>
        </div>
      </section>

      <!-- Fleet Section -->
      <${FleetSection} t=${t.fleet} />

      <!-- Drivers Section -->
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">${t.drivers.title}</h2>
            <p className="text-gray-600">${t.drivers.subtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            ${DRIVERS.map((driver, idx) => html`
              <div key=${idx} className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img 
                    src=${driver.image} 
                    alt=${driver.name} 
                    className="w-full h-full object-cover rounded-full border-2 border-brand-100" 
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="400"
                  />
                  <div className="absolute bottom-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center">
                    ${driver.rating} <${Star} size=${8} className="ml-0.5 fill-current" />
                  </div>
                </div>
                <h5 className="font-bold text-gray-900 text-sm">${driver.name}</h5>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">${driver.bio}</p>
              </div>
            `)}
          </div>
        </div>
      </section>

      <!-- FAQ / Ghost Links -->
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
           <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">${t.faq.title}</h3>
           <div className="space-y-4 mb-16">
             ${t.faq.items.map((item, idx) => html`
               <div key=${idx} className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 ${activeAccordion === idx ? 'bg-gray-50 border-brand-200' : 'bg-white'}">
                 <button 
                  onClick=${() => toggleAccordion(idx)}
                  className="w-full flex justify-between items-center p-5 text-left font-semibold text-gray-800 hover:text-brand-600 transition-colors"
                 >
                   ${item.q}
                   ${activeAccordion === idx ? html`<${ChevronUp} size=${20} />` : html`<${ChevronDown} size=${20} />`}
                 </button>
                 <div className=${`px-5 pb-5 text-gray-600 text-sm leading-relaxed transition-all duration-300 ${activeAccordion === idx ? 'block' : 'hidden'}`}>
                   ${item.a}
                 </div>
               </div>
             `)}
           </div>

           <!-- Policies & Terms Section -->
           <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-12">
             <!-- Cancellation Policy -->
             <div>
                <div className="flex items-center gap-2 mb-4 text-red-600">
                  <${AlertCircle} size=${20} />
                  <h4 className="font-bold text-lg text-gray-900">${t.policy.cancellationTitle}</h4>
                </div>
                <ul className="space-y-3">
                  ${t.policy.cancellation.map((item, idx) => html`
                    <li key=${idx} className="flex gap-3 text-sm text-gray-600">
                      <span className="text-red-400 mt-1.5">•</span>
                      <span>${item}</span>
                    </li>
                  `)}
                </ul>
             </div>

             <!-- Terms & Conditions -->
             <div>
                <div className="flex items-center gap-2 mb-4 text-brand-600">
                  <${FileText} size=${20} />
                  <h4 className="font-bold text-lg text-gray-900">${t.policy.termsTitle}</h4>
                </div>
                <ul className="space-y-3">
                  ${t.policy.terms.map((item, idx) => html`
                    <li key=${idx} className="flex gap-3 text-sm text-gray-600">
                      <span className="text-brand-400 mt-1.5">•</span>
                      <span>${item}</span>
                    </li>
                  `)}
                </ul>
             </div>
           </div>

        </div>
      </section>

      <!-- Footer -->
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <span className="text-2xl font-bold text-white tracking-tight">OM SAI</span>
               <span className="ml-2 text-sm font-medium text-gray-400">Tour & Travels</span>
               <p className="mt-2 text-sm text-gray-500">Serving Mumbai since 2015</p>
            </div>
            
            <div className="flex gap-4">
              <a href=${`tel:${PHONE_NUMBER}`} className="px-6 py-3 rounded-full bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
                Call Us Now
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
             © ${new Date().getFullYear()} Om Sai Tour and Travels. All rights reserved.
          </div>
        </div>
      </footer>

      <!-- Mobile Action Bar -->
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex gap-3 md:hidden z-50 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick=${() => window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent("Hi, I want to book a cab.")}`, '_blank')}
          className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          WhatsApp
        </button>
         <a 
          href=${`tel:${PHONE_NUMBER}`}
          className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <${Phone} size=${18} /> Call
        </a>
      </div>
    </div>
  `;
}

export default App;