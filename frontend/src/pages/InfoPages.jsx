import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Heart, Award, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReetSutra } from '../context/ReetSutraContext';
import { API_BASE_URL } from '../config';
import { getWhatsAppUrl } from '../utils/whatsapp';

// ==========================================
// 1. ABOUT US
// ==========================================
export function AboutUs() {
  const { settings } = useReetSutra();
  const [storyData, setStoryData] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStoryData(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const activeData = (settings && settings.ourStoryTitle) ? settings : storyData;

  const subtitle = activeData?.ourStorySubtitle || "OUR MISSION";
  const title = activeData?.ourStoryTitle || "Restoring the Forgotten Flavors of Bihar";
  const desc = activeData?.ourStoryDescription || "ReetSutra is built on three pillars: Heritage preservation, premium natural quality, and direct empowerment of rural women collectives. We believe traditional recipes are sacred cultural trusts that deserve to be celebrated globally.";
  const womenTitle = activeData?.womenTitle || "Empowering Rural Women Collectives";
  const womenDesc1 = activeData?.womenDesc1 || "At the heart of ReetSutra is our collaboration with local Self-Help Groups (SHGs) across districts like Nalanda, Gaya, Madhubani, and Patna. These home chefs are master guardians of culinary methods developed over centuries.";
  const womenDesc2 = activeData?.womenDesc2 || "By offering complete infrastructure training, fair pricing, and direct digital supply chains, we enable local women to achieve absolute financial security. When you buy a pack of Thekua or hand-pounded Tilkut, your money goes directly into a woman artisan's bank account.";
  const artisanCount = activeData?.artisanCount || "150+";
  const districtsCount = activeData?.districtsCount || "12+";

  const rawImg = activeData?.ourStoryImage ? activeData.ourStoryImage.trim() : "";
  const backendBase = API_BASE_URL.replace(/\/api$/, '');
  const storyImg = rawImg
    ? ((rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('data:'))
        ? rawImg
        : `${backendBase}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
    : null;

  const showImage = Boolean(storyImg && !imageError);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Hero Narrative */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
          {subtitle}
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-brand-green font-serif leading-tight">
          {title}
        </h1>
        <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
        <p className="text-sm md:text-base text-brand-charcoalLight font-sans leading-relaxed pt-2">
          {desc}
        </p>
      </section>

      {/* Visual story grid */}
      <section className={`grid grid-cols-1 ${showImage ? 'lg:grid-cols-2 gap-12' : 'max-w-3xl mx-auto'} items-center`}>
        <div className="space-y-6 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
          <h2 className="text-xl md:text-2xl font-bold text-brand-green font-serif">
            {womenTitle}
          </h2>
          <p>{womenDesc1}</p>
          <p>{womenDesc2}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 text-center">
            <div className="border border-brand-gold/20 p-4 rounded bg-brand-ivory">
              <span className="text-2xl font-black text-brand-green block">{artisanCount}</span>
              <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">Artisan Chefs</span>
            </div>
            <div className="border border-brand-gold/20 p-4 rounded bg-brand-ivory">
              <span className="text-2xl font-black text-brand-green block">{districtsCount}</span>
              <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">Rural Districts</span>
            </div>
          </div>
        </div>

        {showImage && (
          <div className="rounded-lg overflow-hidden border border-brand-gold/15 shadow-premium">
            <img
              src={storyImg}
              alt="Our Story"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </section>

      {/* Quality Guarantees */}
      <section className="bg-brand-ivory rounded-lg border border-brand-gold/10 p-8 shadow-premium space-y-8">
        <div className="text-center space-y-1">
          <h3 className="text-lg md:text-xl font-bold text-brand-green font-serif">
            Our Quality Commitments
          </h3>
          <p className="text-xs text-brand-gold font-bold uppercase tracking-wider font-sans">
            Pure ingredients cooked under clean parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-brand-green font-serif">100% Sugarcane Jaggery</h4>
            <p className="text-[11px] md:text-xs text-brand-charcoalLight/80 font-sans leading-relaxed">
              We never use white refined sugar or artificial corn syrups. Our sweets are naturally flavored using high-grade winter jaggery.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-brand-green font-serif">Pure Deshi A2 Ghee</h4>
            <p className="text-[11px] md:text-xs text-brand-charcoalLight/80 font-sans leading-relaxed">
              We slow-fry and bind our delicacies in fresh cow A2 deshi ghee, delivering rich aroma and healthy dietary fats.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-sm">
              <Heart className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-brand-green font-serif">GI-Tagged Authenticity</h4>
            <p className="text-[11px] md:text-xs text-brand-charcoalLight/80 font-sans leading-relaxed">
              We source ingredients from their native zones (like Mithila foxnuts and Silaao flour) to conserve regional bio-diversities.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

// ==========================================
// 2. CONTACT US
// ==========================================
export function ContactUs() {
  const { settings } = useReetSutra();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Title */}
      <section className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
          GET IN TOUCH
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-green font-serif">
          Reach Out to ReetSutra
        </h1>
        <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
        <p className="text-xs md:text-sm text-brand-charcoalLight pt-2">
          Have queries about bulk festive gifting, custom product orders, or shipment delays? Send us a message!
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Contact Form */}
        <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 md:p-8 shadow-premium space-y-6">
          <h3 className="font-bold text-sm text-brand-green tracking-wider uppercase font-serif border-b border-brand-creamDark pb-2.5">
            Send Customer Message
          </h3>

          {submitted ? (
            <div className="text-center py-8 space-y-2 font-sans text-xs md:text-sm">
              <p className="font-bold text-green-600">✓ Message Dispatched successfully!</p>
              <p className="text-brand-charcoalLight/80">Our support coordinators will contact you within 24 business hours.</p>
            </div>
          ) : (
            <form onSubmit={handleMessageSubmit} className="space-y-4 font-sans text-xs">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nikhil Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="nikhil@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Message Details</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Write your feedback or bulk order requirements here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-greenDark text-brand-cream py-3 rounded font-sans text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center space-x-1 shadow-gold-glow"
              >
                <span>Send Message</span>
                <Send className="w-3.5 h-3.5" />
              </button>

            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
            <h3 className="font-bold text-sm text-brand-green tracking-wider uppercase font-serif border-b border-brand-creamDark pb-2.5">
              Contact Details
            </h3>

            <ul className="space-y-4 font-sans text-xs md:text-sm text-brand-charcoalLight">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-green">Corporate Address:</p>
                  <p>{settings?.contactAddress || "Patna, Bihar, India"}</p>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                <div>
                  <p className="font-bold text-brand-green inline-block mr-1">Phone:</p>
                  <span>{settings?.contactPhone || "+91 76439 30659"}</span>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                <div>
                  <p className="font-bold text-brand-green inline-block mr-1">Email Support:</p>
                  <span>{settings?.contactEmail || "hello@reetsutra.com"}</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp chat hook */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-premium space-y-3 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-green-800 text-sm md:text-base font-serif">Quick WhatsApp Support</h4>
              <p className="text-xs text-green-700 leading-normal font-sans">
                Chat directly with our support specialists for swift order updates.
              </p>
            </div>
            <a 
              href={getWhatsAppUrl()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 shrink-0"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-6 h-6 fill-current" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// 3. PRIVACY POLICY
// ==========================================
export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-sans text-xs md:text-sm text-brand-charcoalLight leading-relaxed">
      <h1 className="text-2xl md:text-4xl font-extrabold text-brand-green font-serif text-center">Privacy Policy</h1>
      <p className="text-center text-brand-gold font-semibold uppercase tracking-wider text-[11px]">Last Updated: June 25, 2026</p>
      <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2 mb-6" />

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">1. Introduction</h2>
      <p>
        Vrindesha Private Limited ("we", "our", or "ReetSutra") respects the privacy of our customers and visitors. This Privacy Policy describes how we collect, store, and share your personal data when you interact with our e-commerce platform.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">2. Data We Collect</h2>
      <p>
        We may collect contact information (such as your name, delivery addresses, phone number, and email address), and account billing preferences. Because all transaction details are managed by secure partners, we do not store credit/debit card numbers directly on our servers.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">3. Use of Personal Information</h2>
      <p>
        We process your data to fulfill orders, ship treats, send shipping update notifications, process secure transactions, and send optional newsletter coupons. We never sell your personal information to third-party marketing companies.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">4. Contact Information</h2>
      <p>
        For questions or reviews regarding our privacy guidelines, please reach out to us at: <span className="font-bold text-brand-green">sutra@reetsutra.com</span>.
      </p>
    </div>
  );
}

// ==========================================
// 4. TERMS & CONDITIONS
// ==========================================
export function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-sans text-xs md:text-sm text-brand-charcoalLight leading-relaxed">
      <h1 className="text-2xl md:text-4xl font-extrabold text-brand-green font-serif text-center">Terms & Conditions</h1>
      <p className="text-center text-brand-gold font-semibold uppercase tracking-wider text-[11px]">Last Updated: June 25, 2026</p>
      <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2 mb-6" />

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">1. User Agreement</h2>
      <p>
        By using the ReetSutra website and buying our handmade food products, you agree to comply with and be bound by the following terms of service. Please review these rules carefully.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">2. Order Acceptance & Custom Cooking</h2>
      <p>
        Because our products are handcrafted in small batches by women collectives, orders might require up to 48 hours of preparation before shipping. We reserve the right to modify or cancel orders if ingredients are unavailable due to seasonal variations.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">3. Pricing & Shipping</h2>
      <p>
        Prices are listed in Indian Rupees (INR) and are inclusive of standard local taxes. Shipping fees are added dynamically depending on order value and delivery distances. We are not liable for package delays caused by bad weather or courier disruptions.
      </p>

      <h2 className="text-base md:text-lg font-bold text-brand-green font-serif mt-6">4. Liability</h2>
      <p>
        Our delicacies are FSSAI certified. However, customers are advised to inspect the ingredients list on product cards to verify allergen safety (such as gluten or sesame seeds) before consumption.
      </p>
    </div>
  );
}
