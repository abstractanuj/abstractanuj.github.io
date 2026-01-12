import React, { useState } from 'react';
import Navbar from './Navbar.js';
import FleetSection from './FleetSection.js';
import BookingForm from './BookingForm.js';
import { SERVICES_DATA, TERMS_AND_CONDITIONS, PHONE_NUMBER, WHATSAPP_NUMBER } from './constants.js';
import { Phone, Check, Shield, Calculator, ArrowRight, MapPin } from 'lucide-react';
import { html } from 'htm/react';

function App() {
  const [distance, setDistance] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(null);

  const calculateEstimate = () => {
    const dist = parseFloat(distance);
    if (isNaN(dist)) return;
    const min = Math.floor(dist * 18); 
    const max = Math.floor(dist * 24);
    setEstimatedCost(`₹${min} - ₹${max}`);
  };

  return html`
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <${Navbar} />

      <!-- Hero Section -->
      <div id="home" className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-brand-50">
        <!-- Abstract Background Shape -->
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[400px] h-[400px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            
            <!-- Hero Content -->
            <div className="lg:col-span-7 mb-12 lg:mb-0 animate-fade-up">
              <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-900 text-sm font-semibold mb-6">
                #1 Cab Service in Andheri East
              </span>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
                Your Daily Commute, <br />
                <span className="text-brand-600">Simplified.</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                Clean cars. Professional drivers. Transparent pricing. 
                Book your ride instantly via WhatsApp and travel without the hassle.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#booking" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Book a Ride
                </a>
                <a href="#services" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                  View Services
                </a>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <${Shield} className="w-5 h-5 text-green-500" /> Safe Rides
                </div>
                 <div className="flex items-center gap-2">
                  <${Check} className="w-5 h-5 text-green-500" /> 24/7 Support
                </div>
              </div>
            </div>

            <!-- Booking Form Container -->
            <div className="lg:col-span-5 animate-fade-up delay-200">
              <${BookingForm} />
            </div>
          </div>
        </div>
      </div>

      <!-- Services Section -->
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">Why Choose Us</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">Services Designed for You</h3>
            <p className="mt-4 text-lg text-gray-500">From quick drops to full-day rentals, we have a package that fits your needs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            ${SERVICES_DATA.map((service, idx) => html`
              <div key=${service.id} className="group p-8 bg-gray-50 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-card border border-transparent hover:border-gray-100">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-brand-600 group-hover:scale-110 transition-transform duration-300">
                  ${service.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">${service.title}</h4>
                <p className="text-gray-600 leading-relaxed">${service.description}</p>
                <div className="mt-6 pt-6 border-t border-gray-200/50 flex items-center text-brand-600 font-semibold text-sm cursor-pointer group-hover:underline">
                  Learn more <${ArrowRight} size=${16} className="ml-2" />
                </div>
              </div>
            `)}
          </div>
        </div>
      </section>

      <!-- Fleet Section -->
      <${FleetSection} />

      <!-- Pricing Section -->
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
            
            <!-- Left Content -->
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase mb-4">
                <${Calculator} size=${14} /> Transparent Fares
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Fair Pricing, <br/>No Hidden Charges.</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We believe in building trust. Our pricing is straightforward—calculated based on distance and fuel. You only pay for what you use.
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">₹</span>
                  Quick Estimator
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">One-way Distance (km)</label>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        value=${distance}
                        onChange=${(e) => setDistance(e.target.value)}
                        className="block w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-gray-900 focus:bg-white transition-colors"
                        placeholder="e.g. 15"
                      />
                      <button 
                        onClick=${calculateEstimate}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                      >
                        Calculate
                      </button>
                    </div>
                  </div>
                  
                  ${estimatedCost && html`
                    <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100 flex justify-between items-center animate-fade-up">
                      <span className="text-sm text-gray-600 font-medium">Estimated Fare:</span>
                      <span className="text-2xl font-extrabold text-gray-900">${estimatedCost}*</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">*Indicative price. Excludes tolls/parking.</p>
                  `}
                </div>
              </div>
            </div>

            <!-- Right Content (Trust Factors) -->
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <${Check} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Calculated Base Fare</h4>
                  <p className="text-gray-500 mt-1">Fair calculation based on current fuel prices and route distance.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <${MapPin} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">You Pay Actuals</h4>
                  <p className="text-gray-500 mt-1">Tolls and parking fees are paid directly by you, no markups.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <${Shield} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Verified & Insured</h4>
                  <p className="text-gray-500 mt-1">All our vehicles are commercially insured and drivers verified.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      <!-- Terms -->
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h3 className="text-xl font-bold text-gray-900 mb-8">Things to know</h3>
           <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
              ${TERMS_AND_CONDITIONS.map((term, i) => html`
                <div key=${i} className="flex gap-3 text-sm text-gray-600 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0"></span>
                  <span className="leading-relaxed">${term}</span>
                </div>
              `)}
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
            
            <div className="flex flex-wrap justify-center gap-6">
               <a href="#" className="hover:text-white transition-colors">Home</a>
               <a href="#services" className="hover:text-white transition-colors">Services</a>
               <a href="#fleet" className="hover:text-white transition-colors">Fleet</a>
               <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex gap-4">
              <a href=${`tel:${PHONE_NUMBER}`} className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
                Call Us
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
        <a 
          href=${`https://wa.me/${WHATSAPP_NUMBER}`}
          className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          WhatsApp
        </a>
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