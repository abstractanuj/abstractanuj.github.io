import { Users, Clock, MapPin, Shield, Star, Wallet, CalendarCheck } from 'lucide-react';
import { html } from 'htm/react';

export const PHONE_NUMBER = "9920277105"; 
export const WHATSAPP_NUMBER = "919920277105"; 
export const LOGO_URL = "https://files.catbox.moe/eg15uw.png";

export const TRANSLATIONS = {
  en: {
    nav: { home: "Home", services: "Services", fleet: "Fleet", pricing: "Benefits", contact: "Contact" },
    hero: {
      badge: "#1 Cab Service in Andheri East",
      title: "Your Daily Commute,",
      subtitle: "Simplified.",
      desc: "Clean cars. Professional drivers. Transparent pricing. Book your ride instantly via WhatsApp.",
      bookBtn: "Book a Ride",
      viewServices: "View Services",
      safe: "Safe Rides",
      support: "24/7 Support"
    },
    booking: {
      title: "Book Your Ride",
      subtitle: "Instant confirmation via WhatsApp",
      pickup: "Pickup Location",
      drop: "Drop Location",
      date: "Date",
      time: "Time",
      car: "Car Type",
      tripType: ["One Way", "Round Trip", "Rental"],
      cta: "Send Enquiry"
    },
    benefits: {
      title: "Why Choose Us?",
      subtitle: "Better than the apps. Cheaper, Safer, Faster.",
      items: [
        { title: "Lower Cost", desc: "Significantly cheaper than Ola/Uber surge pricing.", icon: Wallet },
        { title: "Trusted Pilots", desc: "Known drivers with verified backgrounds.", icon: Shield },
        { title: "Advance Booking", desc: "Schedule rides days in advance reliably.", icon: CalendarCheck },
        { title: "Transparency", desc: "No hidden charges or cancellation fees.", icon: Star },
      ]
    },
    drivers: {
      title: "Meet Our Pilots",
      subtitle: "Experienced professionals dedicated to your safety."
    },
    fleet: {
      title: "Our Fleet",
      subtitle: "Comfort for Every Budget",
      avail: "Available Now",
      busy: "Busy"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "How do I book a ride?", a: "Simply fill out the form above or click the WhatsApp button. We will confirm your ride instantly." },
        { q: "Are there any hidden charges?", a: "No. You pay the estimated fare plus actual toll/parking charges. No surge pricing." },
        { q: "Can I book for an outstation trip?", a: "Yes! We specialize in outstation trips from Mumbai to Pune, Nashik, Shirdi, and Goa." },
        { q: "Is night driving safe?", a: "Absolutely. All our drivers are vetted locals with 5+ years of experience." }
      ]
    },
    policy: {
      title: "Policies & Terms",
      cancellationTitle: "Cancellation Policy",
      termsTitle: "Terms & Conditions",
      cancellation: [
        "Free cancellation allowed up to 2 hours before the scheduled pickup time.",
        "50% cancellation fee applies if cancelled within 2 hours of pickup.",
        "No refund will be provided if the driver has already reached the pickup location.",
        "For outstation round trips, calendar day payment is applicable."
      ],
      terms: [
        "Toll taxes, parking fees, and state entry taxes are to be paid by the customer on actuals.",
        "Night charges applicable between 11:00 PM and 5:00 AM.",
        "Waiting charges apply after 15 minutes from the scheduled time.",
        "Smoking and drinking alcohol is strictly prohibited inside the vehicle."
      ]
    }
  },
  hi: {
    nav: { home: "होम", services: "सेवाएं", fleet: "गाड़ियाँ", pricing: "फायदे", contact: "संपर्क" },
    hero: {
      badge: "अंधेरी ईस्ट की #1 कैब सेवा",
      title: "आपका दैनिक सफर,",
      subtitle: "हुआ आसान।",
      desc: "साफ गाड़ियाँ। अनुभवी ड्राइवर। पारदर्शी कीमत। व्हाट्सएप के जरिए तुरंत बुक करें।",
      bookBtn: "बुक करें",
      viewServices: "सेवाएं देखें",
      safe: "सुरक्षित यात्रा",
      support: "24/7 सहायता"
    },
    booking: {
      title: "अपनी सवारी बुक करें",
      subtitle: "व्हाट्सएप पर तुरंत पुष्टि",
      pickup: "पिकअप का स्थान",
      drop: "छोड़ने का स्थान",
      date: "तारीख",
      time: "समय",
      car: "गाड़ी का प्रकार",
      tripType: ["एक तरफ", "राउंड ट्रिप", "किराये पर"],
      cta: "पूछताछ भेजें"
    },
    benefits: {
      title: "हमें क्यों चुनें?",
      subtitle: "ऐप्स से बेहतर। सस्ता, सुरक्षित, तेज़।",
      items: [
        { title: "कम कीमत", desc: "ओला/उबर की सर्ज प्राइसिंग से काफी सस्ता।", icon: Wallet },
        { title: "भरोसेमंद ड्राइवर", desc: "सत्यापित अनुभव वाले हमारे अपने ड्राइवर।", icon: Shield },
        { title: "एडवांस बुकिंग", desc: "अपनी सवारी पहले से सुरक्षित करें।", icon: CalendarCheck },
        { title: "पारदर्शिता", desc: "कोई छिपे हुए शुल्क या रद्दीकरण शुल्क नहीं।", icon: Star },
      ]
    },
    drivers: {
      title: "हमारे चालकों से मिलें",
      subtitle: "आपकी सुरक्षा के लिए समर्पित अनुभवी पेशेवर।"
    },
    fleet: {
      title: "हमारी गाड़ियाँ",
      subtitle: "हर बजट के लिए आरामदायक",
      avail: "उपलब्ध है",
      busy: "व्यस्त"
    },
    faq: {
      title: "अक्सर पूछे जाने वाले सवाल",
      items: [
        { q: "मैं बुकिंग कैसे करूँ?", a: "बस ऊपर दिया गया फॉर्म भरें या व्हाट्सएप बटन पर क्लिक करें।" },
        { q: "क्या कोई छिपे हुए शुल्क हैं?", a: "नहीं। आप केवल अनुमानित किराया और टोल/पार्किंग का भुगतान करते हैं।" },
        { q: "क्या मैं बाहर गाँव के लिए बुक कर सकता हूँ?", a: "हाँ! हम मुंबई से पुणे, नासिक, शिरडी और गोवा के लिए विशेष सेवा देते हैं।" },
        { q: "क्या रात का सफर सुरक्षित है?", a: "बिल्कुल। हमारे सभी ड्राइवर 5+ साल के अनुभव वाले स्थानीय लोग हैं।" }
      ]
    },
    policy: {
      title: "नीतियां और शर्तें",
      cancellationTitle: "रद्दीकरण नीति",
      termsTitle: "नियम और शर्तें",
      cancellation: [
        "पिकअप समय से 2 घंटे पहले तक निःशुल्क रद्दीकरण।",
        "2 घंटे के भीतर रद्द करने पर 50% शुल्क लागू होगा।",
        "यदि ड्राइवर पिकअप स्थान पर पहुँच चुका है तो कोई रिफंड नहीं मिलेगा।",
        "बाहर गाँव की राउंड ट्रिप के लिए कैलेंडर डे पेमेंट लागू है।"
      ],
      terms: [
        "टोल टैक्स, पार्किंग और राज्य प्रवेश कर ग्राहक को भरने होंगे।",
        "रात का शुल्क 11:00 बजे से सुबह 5:00 बजे तक लागू है।",
        "निर्धारित समय से 15 मिनट बाद वेटिंग चार्ज लागू होगा।",
        "गाड़ी के अंदर धूम्रपान और शराब पीना सख्त मना है।"
      ]
    }
  },
  mr: {
    nav: { home: "होम", services: "सेवा", fleet: "आमच्या गाड्या", pricing: "फायदे", contact: "संपर्क" },
    hero: {
      badge: "अंधेरी पूर्व मधील #1 टॅक्सी सेवा",
      title: "तुमचा रोजचा प्रवास,",
      subtitle: "आता सोप्पा.",
      desc: "स्वच्छ गाड्या. अनुभवी चालक. योग्य दर. व्हॉट्सॲप द्वारे त्वरित बुक करा.",
      bookBtn: "बुक करा",
      viewServices: "सेवा पहा",
      safe: "सुरक्षित प्रवास",
      support: "24/7 मदत"
    },
    booking: {
      title: "तुमची टॅक्सी बुक करा",
      subtitle: "व्हाट्सएप वर त्वरित कन्फर्मेशन",
      pickup: "पिकअप ठिकाण",
      drop: "पोचण्याचे ठिकाण",
      date: "तारीख",
      time: "वेळ",
      car: "गाडीचा प्रकार",
      tripType: ["वन वे", "राउंड ट्रिप", "रेंटल"],
      cta: "चौकशी करा"
    },
    benefits: {
      title: "आम्हाला का निवडावे?",
      subtitle: "इतर ॲप्सपेक्षा उत्तम. स्वस्त, सुरक्षित, जलद.",
      items: [
        { title: "कमी खर्च", desc: "ओला/उबर च्या वाढीव दरांपेक्षा खूप स्वस्त.", icon: Wallet },
        { title: "खात्रीशीर चालक", desc: "पडताळणी केलेले आमचे अनुभवी चालक.", icon: Shield },
        { title: "अगाऊ बुकिंग", desc: "तुमचा प्रवास आधीच निश्चित करा.", icon: CalendarCheck },
        { title: "पारदर्शकता", desc: "कोणतेही छुपे शुल्क नाही.", icon: Star },
      ]
    },
    drivers: {
      title: "आमचे सारथी",
      subtitle: "तुमच्या सुरक्षेसाठी समर्पित अनुभवी व्यावसायिक."
    },
    fleet: {
      title: "आमच्या गाड्या",
      subtitle: "प्रत्येक बजेटसाठी उत्तम पर्याय",
      avail: "उपलब्ध",
      busy: "व्यस्त"
    },
    faq: {
      title: "नेहमी विचारले जाणारे प्रश्न",
      items: [
        { q: "मी बुकिंग कसे करू?", a: "फक्त वरील फॉर्म भरा किंवा व्हॉट्सॲप बटणावर क्लिक करा." },
        { q: "काही छुपे शुल्क आहेत का?", a: "नाही. तुम्ही फक्त ठरलेले भाडे आणि टोल/पार्किंगचे पैसे देता." },
        { q: "मी बाहेरगावासाठी बुक करू शकतो का?", a: "हो! आम्ही मुंबईहून पुणे, नाशिक, शिर्डी आणि गोव्यासाठी खास गाड्या देतो." },
        { q: "रात्रीचा प्रवास सुरक्षित आहे का?", a: "हो. आमचे सर्व चालक ५+ वर्षांचा अनुभव असलेले स्थानिक रहिवासी आहेत." }
      ]
    },
    policy: {
      title: "धोरणे आणि अटी",
      cancellationTitle: "रद्दीकरण धोरण",
      termsTitle: "नियम आणि अटी",
      cancellation: [
        "पिकअप वेळेच्या २ तास आधी मोफत रद्द करता येईल.",
        "२ तासांच्या आत रद्द केल्यास ५०% शुल्क लागेल.",
        "ड्रायव्हर पिकअप ठिकाणी पोहोचल्यास परतावा मिळणार नाही.",
        "आउटस्टेशन राउंड ट्रिपसाठी कॅलेंडर डे पेमेंट लागू आहे."
      ],
      terms: [
        "टोल टॅक्स, पार्किंग आणि एंट्री टॅक्स ग्राहकाने भरावा.",
        "रात्रीचे शुल्क ११:०० ते पहाटे ५:०० पर्यंत लागू.",
        "ठरलेल्या वेळेनंतर १५ मिनिटांनी वेटिंग चार्ज लागेल.",
        "गाडीत धुम्रपान आणि मद्यपान करण्यास सक्त मनाई आहे."
      ]
    }
  }
};

export const DRIVERS = [
  { name: "Ajit", rating: 4.9, bio: "Expert in Mumbai Shortcuts", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60" },
  { name: "Sagar", rating: 4.8, bio: "Safety First Specialist", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=60" },
  { name: "Gaikwad", rating: 5.0, bio: "Highway Veteran (20+ Yrs)", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60" },
  { name: "Sawant", rating: 4.8, bio: "Punctual & Polite", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60" },
  { name: "Babu Rao", rating: 4.7, bio: "Night Owl - 24/7 Service", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60" },
  { name: "Shankar", rating: 4.9, bio: "Customer Favorite", image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=60" },
];

export const FLEET_DATA = [
  {
    id: 'c1',
    name: 'Maruti Suzuki Ertiga',
    type: 'MUV (7 Seater)',
    seats: 7,
    features: ['Double AC', 'Roof Carrier', 'Extra Boot', 'Charging Pts'],
    // Placeholder resembling Ertiga
    imageUrl: 'https://images.unsplash.com/photo-1696581422776-904d44445851?auto=format&fit=crop&q=80&w=800', 
    isAvailable: true,
    statusText: 'Available at Andheri',
    plate: 'MH 02 ER 4421'
  },
  {
    id: 'c2',
    name: 'Toyota Etios',
    type: 'Sedan (4 Seater)',
    seats: 4,
    features: ['Chilled AC', 'Large Legroom', 'Clean Interiors'],
    // Placeholder resembling Sedan
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    isAvailable: false,
    statusText: 'On Trip (Back in 2hrs)',
    plate: 'MH 02 DN 1122'
  },
  {
    id: 'c3',
    name: 'Maruti Suzuki Swift',
    type: 'Hatchback (4 Seater)',
    seats: 4,
    features: ['AC', 'Bluetooth Audio', 'Fast Commute'],
    // Placeholder resembling Hatchback
    imageUrl: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=800',
    isAvailable: true,
    statusText: 'Parked at Hub',
    plate: 'MH 02 SW 9988'
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