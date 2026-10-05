import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReetSutra } from '../context/ReetSutraContext';
import { getWhatsAppUrl } from '../utils/whatsapp';
import rsFooterImg from '../assets/rs_footer_img.png';
import { 
  Mail, 
  Phone, 
  MapPin,
  ShieldCheck,
  Users,
  Star,
  Truck
} from 'lucide-react';

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const WhatsappIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const XTwitterIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GooglePlaySVG = () => (
  <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14.222 9.374c1.037-.61 1.037-2.137 0-2.748L11.528 5.04 8.32 8l3.207 2.96zm-3.595 2.116L7.583 8.68 1.03 14.73c.201 1.029 1.36 1.61 2.303 1.055zM1 13.396V2.603L6.846 8zM1.03 1.27l6.553 6.05 3.044-2.81L3.333.215C2.39-.341 1.231.24 1.03 1.27" />
  </svg>
);

const AppStoreSVG = () => (
  <svg className="w-5 h-5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.98-.59 2.51-1.45z" />
  </svg>
);

export default function Footer() {
  const { settings } = useReetSutra();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const socialLinks = [
    { label: "Instagram", href: settings?.socialInstagram || "https://instagram.com/reetsutra", icon: <InstagramIcon /> },
    { label: "Facebook", href: settings?.socialFacebook || "https://facebook.com/reetsutra", icon: <FacebookIcon /> },
    { label: "YouTube", href: settings?.socialYoutube || "https://youtube.com/@reetsutra", icon: <YoutubeIcon /> },
    { label: "Telegram", href: settings?.socialTelegram || "https://t.me/reetsutra", icon: <TelegramIcon /> },
    { label: "WhatsApp", href: getWhatsAppUrl(), icon: <WhatsappIcon /> },
    { label: "X (Twitter)", href: settings?.socialTwitter || "https://x.com/reetsutra", icon: <XTwitterIcon /> },
    { label: "LinkedIn", href: settings?.socialLinkedin || "https://linkedin.com/company/reetsutra", icon: <LinkedinIcon /> }
  ].filter(soc => Boolean(soc.href));

  return (
    <footer className="bg-brand-green text-brand-cream border-t-2 border-brand-gold/30 pt-12 pb-8">
      
      {/* Main Links Area (4 columns since Newsletter is now integrated into the horizontal bar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-left mb-12">
        
        {/* Brand Column */}
        <div className="space-y-6">
          <div className="flex flex-col">
            <span className="serif-header text-2xl font-black text-brand-gold tracking-wider">REETSUTRA</span>
            <span className="text-[10px] text-brand-cream/80 font-serif italic mt-0.5">"रीत हमारी, स्वाद हमारी, साथ अपनों का"</span>
          </div>
          <p className="text-xs text-brand-cream/70 leading-relaxed font-sans font-light">
            Celebrating the rich culinary heritage of Bihar with authentic, handmade recipes made by local women collectives.
          </p>
          {/* Socials */}
          <div className="flex flex-wrap gap-2 pt-2">
            {socialLinks.map((soc, i) => (
              <a
                key={i}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-brand-greenDark rounded border border-brand-gold/15 hover:border-brand-gold hover:text-brand-gold transition-all duration-200 hover:scale-110"
                aria-label={soc.label}
                title={soc.label}
              >
                {soc.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h4 className="serif-header text-xs font-bold text-brand-gold tracking-widest uppercase">QUICK LINKS</h4>
          <ul className="space-y-2 text-xs text-brand-cream/80 font-sans font-medium">
            <li><Link to="/" className="hover:text-brand-gold hover:underline transition-all">Home</Link></li>
            <li><Link to="/shop" className="hover:text-brand-gold hover:underline transition-all">Shop</Link></li>
            <li><Link to="/shop?category=Pickles" className="hover:text-brand-gold hover:underline transition-all">Pickles</Link></li>
            <li><Link to="/shop?category=Ghee" className="hover:text-brand-gold hover:underline transition-all">Ghee</Link></li>
            <li><Link to="/shop?category=Makhana" className="hover:text-brand-gold hover:underline transition-all">Makhana</Link></li>
            <li><Link to="/shop?category=Thekua" className="hover:text-brand-gold hover:underline transition-all">Thekua</Link></li>
            <li><Link to="/shop?category=Gift Boxes" className="hover:text-brand-gold hover:underline transition-all">Gift Boxes</Link></li>
            <li><Link to="/about" className="hover:text-brand-gold hover:underline transition-all">Our Story</Link></li>
            <li><Link to="#" className="hover:text-brand-gold hover:underline transition-all">Recipes & Blog</Link></li>
            <li><Link to="/contact" className="hover:text-brand-gold hover:underline transition-all">Contact</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-6">
          <h4 className="serif-header text-xs font-bold text-brand-gold tracking-widest uppercase">CUSTOMER CARE</h4>
          <ul className="space-y-2 text-xs text-brand-cream/80 font-sans font-medium">
            <li><Link to="/profile/orders" className="hover:text-brand-gold hover:underline transition-all">Track Order</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-brand-gold hover:underline transition-all">Shipping Policy</Link></li>
            <li><Link to="/return-refund" className="hover:text-brand-gold hover:underline transition-all">Return & Refund</Link></li>
            <li><Link to="/terms-conditions" className="hover:text-brand-gold hover:underline transition-all">Terms & Conditions</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-brand-gold hover:underline transition-all">Privacy Policy</Link></li>
            <li><Link to="/faqs" className="hover:text-brand-gold hover:underline transition-all">FAQ's</Link></li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div id="footer-contact" className="space-y-6 scroll-mt-24">
          <h4 className="serif-header text-xs font-bold text-brand-gold tracking-widest uppercase">CONTACT US</h4>
          <ul className="space-y-3 text-xs text-brand-cream/80 font-sans font-medium">
            <li className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>{settings?.contactPhone || "+91 76439 30659"}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>{settings?.contactEmail || "hello@reetsutra.com"}</span>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
              <span>{settings?.contactAddress || "Patna, Bihar, India"}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Trust, Newsletter & App Download Section - Redesigned bottom bar */}
      <div className="w-full bg-[#15281E] border-t border-brand-gold/25 py-10 mt-8 mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Trust Badges */}
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2.5">
                <Users className="w-5 h-5 text-brand-gold shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-brand-cream font-sans tracking-wide">10,000+</h5>
                  <p className="text-[10px] text-brand-cream/60">Happy Customers</p>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Star className="w-5 h-5 text-brand-gold fill-current shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-brand-cream font-sans tracking-wide">4.9 / 5</h5>
                  <p className="text-[10px] text-brand-cream/60">Average Rating</p>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-brand-cream font-sans tracking-wide">100% Secure</h5>
                  <p className="text-[10px] text-brand-cream/60">Payment Gateway</p>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-brand-gold shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-brand-cream font-sans tracking-wide">Pan India</h5>
                  <p className="text-[10px] text-brand-cream/60">Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Newsletter Subscription */}
          <div className="space-y-3 text-left border-y lg:border-y-0 lg:border-x border-brand-gold/15 py-6 lg:py-0 lg:px-8">
            <h4 className="serif-header text-sm font-bold text-brand-gold tracking-wider">Stay Updated With ReetSutra</h4>
            <p className="text-xs text-brand-cream/75 font-sans leading-normal">
              Subscribe to get exclusive offers, traditional recipes, and latest updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-green border border-brand-gold/20 focus:border-brand-gold rounded px-3 py-2 text-brand-cream placeholder-brand-cream/40 focus:outline-none text-xs font-sans"
              />
              <button
                type="submit"
                className="bg-brand-gold hover:bg-brand-goldLight text-brand-green py-2 px-4 rounded font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <span>SUBSCRIBE</span>
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-brand-gold font-semibold pt-1">
                ✓ Subscribed successfully!
              </p>
            )}
          </div>

          {/* Right Column: App Downloads */}
          <div className="space-y-4 text-left">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="serif-header text-sm font-bold text-brand-gold tracking-wider">DOWNLOAD OUR APP</h4>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40 shadow-xs animate-pulse">
                  Live Soon
                </span>
              </div>
              <p className="text-xs text-brand-cream/75 font-sans mt-1">Mobile App launching soon on Android & iOS!</p>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-1">
              {/* Google Play Button */}
              <div className="relative group">
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="bg-black/90 text-white flex items-center space-x-2.5 px-3.5 py-1.5 rounded border border-brand-gold/30 opacity-85 cursor-not-allowed shadow-md shrink-0 transition-all"
                  title="ReetSutra Android App Coming Soon"
                >
                  <GooglePlaySVG />
                  <div className="flex flex-col items-start text-left leading-none">
                    <span className="text-[8px] uppercase tracking-wider text-brand-gold font-bold font-sans">COMING SOON</span>
                    <span className="text-[11px] font-bold font-sans text-[#FFF] mt-0.5">Google Play</span>
                  </div>
                </a>
              </div>

              {/* App Store Button */}
              <div className="relative group">
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  className="bg-black/90 text-white flex items-center space-x-2.5 px-3.5 py-1.5 rounded border border-brand-gold/30 opacity-85 cursor-not-allowed shadow-md shrink-0 transition-all"
                  title="ReetSutra iOS App Coming Soon"
                >
                  <AppStoreSVG />
                  <div className="flex flex-col items-start text-left leading-none">
                    <span className="text-[8px] uppercase tracking-wider text-brand-gold font-bold font-sans">COMING SOON</span>
                    <span className="text-[11px] font-bold font-sans text-[#FFF] mt-0.5">App Store</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Traditional Bihar Village Heritage Artwork Banner */}
      <div className="w-full overflow-hidden mt-0 mb-2">
        <img
          src={rsFooterImg}
          alt="ReetSutra Bihar Village Heritage Art"
          className="w-full h-auto max-h-32 sm:max-h-44 md:max-h-56 lg:max-h-64 object-cover object-center transition-opacity duration-300"
        />
      </div>

      {/* Bottom Copyright bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-brand-gold/10 pt-4">
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-brand-cream/60 font-sans gap-4">
          <p>© {new Date().getFullYear()} Vrindesha Private Limited. All Rights Reserved.</p>
          <p className="flex items-center space-x-4">
            <span>Made with ❤ in Bihar</span>
            <span>•</span>
            <span>Designed for Health & Heritage</span>
          </p>
        </div>
      </div>

    </footer>
  );
}
