import { Users, Clock, MapPin } from 'lucide-react';
import { html } from 'htm/react';

export const COMPANY_NAME = "Om Sai Tour and Travels";
export const OWNER_NAME = "Mr. Sanjay Singh";
export const PHONE_NUMBER = "9920277105"; 
export const WHATSAPP_NUMBER = "919920277105"; 

export const FLEET_DATA = [
  {
    id: 'c1',
    name: 'Maruti Suzuki Ertiga',
    type: 'MUV',
    seats: 7,
    features: ['AC', 'Music System', 'Extra Luggage Space', 'USB Charging'],
    imageUrl: 'https://images.unsplash.com/photo-1696581422776-904d44445851?auto=format&fit=crop&q=80&w=800',
    isAvailable: true,
    nextAvailableTime: 'Now'
  },
  {
    id: 'c2',
    name: 'Toyota Etios',
    type: 'Sedan',
    seats: 4,
    features: ['AC', 'Premium Sound', 'Comfort Legroom'],
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    isAvailable: false,
    nextAvailableTime: 'In 45 mins'
  },
  {
    id: 'c3',
    name: 'Maruti Suzuki Swift',
    type: 'Hatchback',
    seats: 4,
    features: ['AC', 'Bluetooth Audio', 'City Zoom'],
    imageUrl: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=800',
    isAvailable: true,
    nextAvailableTime: 'Now'
  }
];

export const SERVICES_DATA = [
  {
    id: 's1',
    title: 'Share Route',
    description: 'Perfect for daily commuters. Share the ride and split the cost efficiently.',
    icon: html`<${Users} className="w-6 h-6" />`
  },
  {
    id: 's2',
    title: 'Full Day Rental',
    description: 'Book a cab for 8hr/80km or 12hr/120km packages. Ideal for business or city tours.',
    icon: html`<${Clock} className="w-6 h-6" />`
  },
  {
    id: 's3',
    title: 'Pick-up & Drop',
    description: 'Airport transfers, station drops, or point-to-point travel across Mumbai.',
    icon: html`<${MapPin} className="w-6 h-6" />`
  }
];

export const TERMS_AND_CONDITIONS = [
  "Discount of ₹50 valid on 1st and 2nd rides only for trips above ₹300.",
  "Toll charges and parking fees are to be paid by the commuter actuals.",
  "Waiting charges apply after 15 minutes of scheduled pickup time.",
  "Night charges apply for rides between 11:00 PM and 5:00 AM.",
  "Advance booking cancellation must be done at least 2 hours prior for full refund.",
  "Smoking and drinking are strictly prohibited inside the vehicle.",
  "Cleaning charges apply if the vehicle is soiled by the passenger.",
  "Final fare is subject to traffic conditions and route changes (unless fixed rental)."
];