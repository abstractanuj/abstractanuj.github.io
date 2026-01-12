import React, { useState } from 'react';
import { FLEET_DATA, WHATSAPP_NUMBER } from './constants.js';
import { Send, MapPin, Calendar, Clock, Car, ChevronDown } from 'lucide-react';
import { html } from 'htm/react';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    carType: 'Any',
    tripType: 'One Way'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `
*New Booking Request*
--------------------------------
🚘 *Trip Type:* ${formData.tripType}
📍 *Pickup:* ${formData.pickupLocation}
🏁 *Drop:* ${formData.dropLocation}
📅 *Date:* ${formData.date}
⏰ *Time:* ${formData.time}
🚗 *Car:* ${formData.carType}
--------------------------------
    `.trim();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return html`
    <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden relative">
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-2xl font-bold text-gray-900">Book Your Ride</h3>
        <p className="text-gray-500 text-sm mt-1">Get instant confirmation via WhatsApp</p>
      </div>
      
      <form onSubmit=${handleSubmit} className="p-8 space-y-5">
        
        <!-- Trip Type Selector -->
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-xl">
          ${['One Way', 'Round Trip', 'Rental'].map((type) => html`
            <button
              key=${type}
              type="button"
              onClick=${() => setFormData({...formData, tripType: type})}
              className=${`text-sm font-semibold py-2.5 rounded-lg transition-all ${
                formData.tripType === type 
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ${type}
            </button>
          `)}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${MapPin} className="h-5 w-5 text-brand-500" />
            </div>
            <input
              type="text"
              name="pickupLocation"
              required
              placeholder="Pickup Location"
              value=${formData.pickupLocation}
              onChange=${handleChange}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${MapPin} className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="dropLocation"
              required
              placeholder="Drop Location"
              value=${formData.dropLocation}
              onChange=${handleChange}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${Calendar} className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="date"
              required
              value=${formData.date}
              onChange=${handleChange}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${Clock} className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="time"
              name="time"
              required
              value=${formData.time}
              onChange=${handleChange}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${Car} className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="carType"
            value=${formData.carType}
            onChange=${handleChange}
            className="block w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="Any">Any Car Type</option>
            ${FLEET_DATA.map(c => html`
              <option key=${c.id} value=${c.name}>${c.name} (${c.seats} Seats)</option>
            `)}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <${ChevronDown} className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center gap-3 py-4 bg-brand-400 hover:bg-brand-500 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <span>Send Enquiry</span>
          <${Send} size=${18} />
        </button>
      </form>
    </div>
  `;
};

export default BookingForm;