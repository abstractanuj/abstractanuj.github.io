import React from 'react';
import { FLEET_DATA } from './constants.js';
import { Users, Fuel, Briefcase, MapPin, BadgeCheck } from 'lucide-react';
import { html } from 'htm/react';

const FleetSection = ({ t }) => {
  return html`
    <section id="fleet" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">${t.title}</h2>
          <h3 className="text-4xl font-extrabold text-gray-900">${t.subtitle}</h3>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          ${FLEET_DATA.map((car) => html`
            <div key=${car.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              
              <!-- Image Area -->
              <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  src=${car.imageUrl} 
                  alt=${car.name} 
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="600"
                />
                
                <!-- Status Badge -->
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  ${car.isAvailable ? html`
                    <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      ${t.avail}
                    </div>
                  ` : html`
                     <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      ${t.busy}
                    </div>
                  `}
                  
                  <div className="bg-white/90 backdrop-blur text-gray-900 px-2 py-1 rounded-lg text-[10px] font-mono font-bold border border-gray-200">
                    ${car.plate}
                  </div>
                </div>

                <!-- Detailed Status Overlay -->
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                   <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                      <${MapPin} size=${14} className="text-brand-400" />
                      ${car.statusText}
                   </div>
                </div>
              </div>

              <!-- Content -->
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">${car.name}</h3>
                    <p className="text-gray-500 text-sm font-medium mt-1">${car.type}</p>
                  </div>
                  <${BadgeCheck} className="text-brand-500 w-6 h-6" />
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100 mb-4">
                   <div className="flex flex-col items-center gap-1 text-center">
                      <${Users} size=${18} className="text-gray-400" />
                      <span className="text-xs text-gray-500">${car.seats} Seats</span>
                   </div>
                    <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100">
                      <${Briefcase} size=${18} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Luggage</span>
                   </div>
                    <div className="flex flex-col items-center gap-1 text-center border-l border-gray-100">
                      <${Fuel} size=${18} className="text-gray-400" />
                      <span className="text-xs text-gray-500">AC</span>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  ${car.features.map((feature, idx) => html`
                    <span key=${idx} className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wide border border-gray-100">
                      ${feature}
                    </span>
                  `)}
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    </section>
  `;
};

export default FleetSection;