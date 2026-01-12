import React, { useState, useEffect, useRef } from 'react';
import { FLEET_DATA, WHATSAPP_NUMBER } from './constants.js';
import { Send, MapPin, Calendar, Clock, Car, ChevronDown, LocateFixed, Loader2 } from 'lucide-react';
import { html } from 'htm/react';
import debounce from 'lodash/debounce';

const BookingForm = ({ t }) => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    date: '',
    time: '',
    carType: 'Any',
    tripType: t.tripType[0]
  });

  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'pickup' or 'drop'
  const [isLocating, setIsLocating] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const suggestionsRef = useRef(null);

  // Debounced fetch for location suggestions
  const fetchSuggestions = useRef(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        // Optimizing for Mumbai Region
        // viewbox order: left,top,right,bottom (West, North, East, South) - approximate MMR
        const viewbox = '72.70,19.60,73.15,18.80';
        
        // Using OpenStreetMap Nominatim API (Free) with Mumbai Bias
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=in&viewbox=${viewbox}&bounded=1&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 400)
  ).current;

  useEffect(() => {
    // Click outside to close suggestions
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestions([]);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'pickupLocation' || name === 'dropLocation') {
      setActiveField(name === 'pickupLocation' ? 'pickup' : 'drop');
      fetchSuggestions(value);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const field = activeField === 'pickup' ? 'pickupLocation' : 'dropLocation';
    setFormData(prev => ({ ...prev, [field]: suggestion.display_name }));
    setSuggestions([]);
    setActiveField(null);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData(prev => ({ ...prev, pickupLocation: data.display_name }));
        } catch (error) {
          console.error("Error getting location:", error);
          alert("Unable to fetch address details.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Unable to retrieve your location. Please check permissions.");
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `
*New Booking Request*
--------------------------------
🚘 *Type:* ${formData.tripType}
📍 *From:* ${formData.pickupLocation}
🏁 *To:* ${formData.dropLocation}
📅 *Date:* ${formData.date}
⏰ *Time:* ${formData.time}
🚗 *Car:* ${formData.carType}
--------------------------------
    `.trim();
    
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return html`
    <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden relative z-10">
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-2xl font-bold text-gray-900">${t.title}</h3>
        <p className="text-brand-600 text-sm mt-1 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          ${t.subtitle}
        </p>
      </div>
      
      <form onSubmit=${handleSubmit} className="p-8 space-y-5">
        
        <!-- Trip Type Selector -->
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-xl">
          ${t.tripType.map((type) => html`
            <button
              key=${type}
              type="button"
              onClick=${() => setFormData({...formData, tripType: type})}
              className=${`text-xs sm:text-sm font-bold py-3 rounded-lg transition-all ${
                formData.tripType === type 
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ${type}
            </button>
          `)}
        </div>

        <div className="space-y-4 relative" ref=${suggestionsRef}>
          
          <!-- Pickup Input -->
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${MapPin} className="h-5 w-5 text-green-600" />
            </div>
            <input
              type="text"
              name="pickupLocation"
              required
              placeholder=${t.pickup}
              value=${formData.pickupLocation}
              onChange=${handleChange}
              autoComplete="off"
              className="block w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white transition-all font-medium truncate"
            />
            <!-- Locate Me Button -->
            <button
              type="button"
              onClick=${handleLocateMe}
              disabled=${isLocating}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-600 transition-colors"
              title="Use Current Location"
            >
              ${isLocating ? html`<${Loader2} className="h-5 w-5 animate-spin text-brand-500" />` : html`<${LocateFixed} className="h-5 w-5" />`}
            </button>
            
            <!-- Suggestions Dropdown for Pickup -->
            ${activeField === 'pickup' && suggestions.length > 0 && html`
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-up">
                ${suggestions.map((item, idx) => html`
                  <button
                    key=${idx}
                    type="button"
                    onClick=${() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate flex items-center gap-2"
                  >
                    <${MapPin} size=${14} className="text-gray-400 flex-shrink-0" />
                    ${item.display_name}
                  </button>
                `)}
              </div>
            `}
          </div>

          <!-- Drop Input -->
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <${MapPin} className="h-5 w-5 text-red-500" />
            </div>
            <input
              type="text"
              name="dropLocation"
              required
              placeholder=${t.drop}
              value=${formData.dropLocation}
              onChange=${handleChange}
              autoComplete="off"
              className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white transition-all font-medium truncate"
            />
             <!-- Suggestions Dropdown for Drop -->
            ${activeField === 'drop' && suggestions.length > 0 && html`
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-up">
                ${suggestions.map((item, idx) => html`
                  <button
                    key=${idx}
                    type="button"
                    onClick=${() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate flex items-center gap-2"
                  >
                    <${MapPin} size=${14} className="text-gray-400 flex-shrink-0" />
                    ${item.display_name}
                  </button>
                `)}
              </div>
            `}
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
              min=${today}
              value=${formData.date}
              onChange=${handleChange}
              className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all font-medium cursor-pointer"
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
              className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all font-medium cursor-pointer"
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
            className="block w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
          >
            <option value="Any">${t.car} (Any)</option>
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
          className="w-full flex justify-center items-center gap-3 py-4 bg-brand-400 hover:bg-brand-500 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          <span>${t.cta}</span>
          <${Send} size=${18} />
        </button>
      </form>
    </div>
  `;
};

export default BookingForm;