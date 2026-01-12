import React from 'react';
import { FLEET_DATA } from './constants.js';
import { Users, Fuel, Briefcase } from 'lucide-react';
import { html } from 'htm/react';

const FleetSection = () => {
  return html`
    <section id="fleet" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">Our Fleet</h2>
          <h3 className="text-4xl font-extrabold text-gray-900">Comfort for Every Budget</h3>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
             Clean, hygienic, and well-maintained cars. Choose the one that suits your group size.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          ${FLEET_DATA.map((car) => html`
            <div key=${car.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-2">
              
              <!-- Image -->
              <div className="relative h-56 bg-gray-100 overflow-hidden">
                <img 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  src=${car.imageUrl} 
                  alt=${car.name} 
                />
                <div className="absolute top-4 right-4">
                  ${car.isAvailable ? html`
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-green-700 shadow-sm backdrop-blur-sm border border-white">
                      Available
                    </span>
                  ` : html`
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-red-600 shadow-sm backdrop-blur-sm border border-white">
                      Busy
                    </span>
                  `}
                </div>
              </div>

              <!-- Content -->
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">${car.name}</h3>
                    <p className="text-gray-500 text-sm font-medium">${car.type}</p>
                  </div>
                  <div className="bg-brand-50 text-brand-700 px-2 py-1 rounded-lg text-xs font-bold">
                    ${car.seats} Seater
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100 mb-4">
                   <div className="flex flex-col items-center gap-1 text-center">
                      <${Users} size=${18} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Spacious</span>
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
                    <span key=${idx} className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-xs font-medium border border-gray-100">
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