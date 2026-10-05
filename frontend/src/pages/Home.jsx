import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useReetSutra } from '../context/ReetSutraContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import {
  Heart,
  Award,
  Sparkles,
  Map,
  ArrowRight,
  Star,
  ShieldCheck,
  MapPin,
  Leaf,
  RotateCcw,
  Truck,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE_URL, BACKEND_URL, handleFrontendImageError } from '../config';

import heroBg from '../assets/Final_Banner_Img_web.png';
import mobileHeroBg from '../assets/Mobile_view_Banner_image.jpg';
import storyImage from '../assets/reet_sutra_story.png';

const PickleJarIcon = () => (
  <svg className="w-4 h-4 text-[#B8934E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h8v3H8z" fill="currentColor" opacity="0.15" />
    <rect x="5" y="6" width="14" height="15" rx="2" />
    <line x1="5" y1="10" x2="19" y2="10" />
    <line x1="5" y1="15" x2="19" y2="15" />
  </svg>
);

// 100% Pixel-Perfect SVG Icons matching the reference image
const SmallBatchesIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" viewBox="0 0 44 44" fill="none">
    {/* Knob */}
    <ellipse cx="22" cy="7.5" rx="2.5" ry="2" fill="#C8A25D" />
    {/* Lid dome */}
    <path d="M14 13.5c1.5-3.5 5.5-4.5 8-4.5s6.5 1 8 4.5H14z" fill="#C8A25D" />
    {/* Neck rim */}
    <rect x="12" y="13.5" width="20" height="2.5" rx="1" fill="#A8823D" />
    {/* Body */}
    <path d="M13 16c-5 3.5-5.5 12.5-0.5 16.5C15.5 35 28.5 35 31.5 32.5c5-4 4.5-13-0.5-16.5H13z" fill="#C8A25D" />
    {/* Pot shadow & highlight lines */}
    <path d="M15 22c3.5 2 10.5 2 14 0" stroke="#FAF6EF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M17 33h10" stroke="#A8823D" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const BiharRecipesIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" viewBox="0 0 44 44" fill="none">
    {/* Central Stem */}
    <path d="M22 36V16" stroke="#C8A25D" strokeWidth="2.2" strokeLinecap="round" />
    {/* Top Center Leaf */}
    <path d="M22 17C22 8 16 6 13 11c-1.5 4.5 3 9 9 6z" fill="#C8A25D" />
    <path d="M22 17c0-9 6-11 9-6 1.5 4.5-3 9-9 6z" fill="#C8A25D" />
    {/* Left Leaf */}
    <path d="M22 25c-7-2-11-8-7-12 4.5-2.5 9.5 3 7 12z" fill="#C8A25D" />
    {/* Right Leaf */}
    <path d="M22 25c7-2 11-8 7-12-4.5-2.5-9.5 3-7 12z" fill="#C8A25D" />
  </svg>
);

const PremiumIngredientsIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" viewBox="0 0 44 44" fill="none" stroke="#C8A25D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Stem */}
    <path d="M22 36V10" strokeWidth="2" />
    {/* Top Leaf */}
    <path d="M22 10c-3.5-5 0-8 3.5-7 1 4.5-1 6.5-3.5 7z" fill="#C8A25D" fillOpacity="0.25" />
    <path d="M22 6v4" strokeWidth="1" />
    {/* Upper Left Leaf */}
    <path d="M22 16c-5-4-9-2-7 3 2.5 4 6 2.5 7-3z" fill="#C8A25D" fillOpacity="0.25" />
    <path d="M17 14.5l5 1.5" strokeWidth="1" />
    {/* Upper Right Leaf */}
    <path d="M22 16c5-4 9-2 7 3-2.5 4-6 2.5-7-3z" fill="#C8A25D" fillOpacity="0.25" />
    <path d="M27 14.5l-5 1.5" strokeWidth="1" />
    {/* Lower Left Leaf */}
    <path d="M22 24c-6-4-10-1-8 4 3 4.5 7 2 8-4z" fill="#C8A25D" fillOpacity="0.25" />
    <path d="M16 22l6 2" strokeWidth="1" />
    {/* Lower Right Leaf */}
    <path d="M22 24c6-4 10-1 8 4-3 4.5-7 2-8-4z" fill="#C8A25D" fillOpacity="0.25" />
    <path d="M28 22l-6 2" strokeWidth="1" />
  </svg>
);

const NoPreservativesIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" viewBox="0 0 44 44" fill="none" stroke="#C8A25D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Outer Circle */}
    <circle cx="22" cy="22" r="16" strokeWidth="1.8" />
    {/* Slash */}
    <line x1="11" y1="33" x2="33" y2="11" strokeWidth="2" />
    {/* Crossed Flask/Drop inside */}
    <path d="M22 14c-3 4-4.5 6.5-4.5 9.5a4.5 4.5 0 0 0 9 0c0-3-1.5-5.5-4.5-9.5z" strokeWidth="1.3" opacity="0.8" />
  </svg>
);

const PrideInBiharIcon = ({ className = "w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" }) => (
  <svg className={className} viewBox="0 0 50 44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Geographic Bihar Map Outline */}
    <path
      d="M 12 18 
         L 13 11 
         L 17 9 
         L 23 10 
         L 29 8 
         L 36 9 
         L 43 12 
         L 44 17 
         L 41 21 
         L 44 25 
         L 42 30 
         L 36 29 
         L 33 34 
         L 26 33 
         L 22 37 
         L 16 33 
         L 14 35 
         L 10 31 
         L 11 25 
         L 7 22 
         Z"
      fill="currentColor"
      fillOpacity="0.12"
      strokeWidth="1.8"
    />
    <path d="M 8 22 C 16 23, 26 21, 42 24" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.6" />
  </svg>
);

const FreshShieldIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#C8A25D] shrink-0" viewBox="0 0 44 44" fill="none" stroke="#C8A25D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {/* Shield Outer */}
    <path d="M22 6l13 5v11c0 10-8 16-13 18C14 38 6 32 6 22V11l13-5z" fill="#C8A25D" fillOpacity="0.12" strokeWidth="1.8" />
    {/* Inner Leaf & Checkmark */}
    <path d="M15 22.5l5 5L29 16" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const { products, settings } = useReetSutra();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedBestsellerCategory, setSelectedBestsellerCategory] = useState('All Products');
  const bestsellerCategories = ['All Products', 'Ghee', 'Pickles', 'Makhana', 'Thekua', 'Combos', 'Gift Boxes'];
  const scrollRef = useRef(null);

  const [heroBanners, setHeroBanners] = useState([]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showFloatingBanner, setShowFloatingBanner] = useState(true);

  const [customerReviews, setCustomerReviews] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/banners?status=Active`);
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data)) {
          setHeroBanners(resJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      } finally {
        setIsBannersLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories?status=Active`);
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data) && resJson.data.length > 0) {
          setDynamicCategories(resJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/reviews/all/latest`);
        const resJson = await response.json();
        if (response.ok && resJson.success && Array.isArray(resJson.data)) {
          setCustomerReviews(resJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch customer reviews:", err);
      }
    };

    fetchBanners();
    fetchCategories();
    fetchReviews();
  }, []);

  // Filter banners for desktop vs mobile views & date validity
  const now = new Date();

  const [currentFloatingIndex, setCurrentFloatingIndex] = useState(0);
  const [isFloatingMuted, setIsFloatingMuted] = useState(true);
  const [isFloatingOpen, setIsFloatingOpen] = useState(true);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // 1. All Active & Valid Banners (Date Check: includes full end date till 23:59:59)
  const activeBanners = React.useMemo(() => {
    const now = new Date();
    return heroBanners.filter(b => {
      if (b.status !== "Active") return false;
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate) {
        const endD = new Date(b.endDate);
        endD.setHours(23, 59, 59, 999);
        if (endD < now) return false;
      }
      return true;
    });
  }, [heroBanners]);

  // Top Hero Banners: Include all active banners (including floating offer banners) in main carousel
  const bannersForHero = activeBanners;

  // Desktop Banners for top hero: Include all banners unless explicitly tagged Mobile
  const displayDesktopBanners = React.useMemo(() => {
    return bannersForHero.filter(b => b.targetDevice !== "Mobile");
  }, [bannersForHero]);

  // Mobile Banners for top hero: Include all banners unless explicitly tagged Desktop
  const displayMobileBanners = React.useMemo(() => {
    return bannersForHero.filter(b => b.targetDevice !== "Desktop");
  }, [bannersForHero]);

  // 2. Floating Banners array for Corner Floating Video/Image Widget
  const floatingBanners = React.useMemo(() => {
    return activeBanners.filter(b => {
      const isFloating = b.bannerType === "Floating" || b.placement?.includes("Floating");
      return isFloating;
    });
  }, [activeBanners]);

  const categoryFloatingOffers = React.useMemo(() => {
    const map = {};
    activeBanners.forEach(b => {
      const isFloating = b.bannerType === "Floating" || b.placement?.includes("Floating");
      if (!isFloating) return;

      if (b.discountPercentage && b.discountPercentage > 0) {
        const targetCat = (b.targetCategory || "All Categories").toLowerCase().trim();
        map[targetCat] = Math.max(map[targetCat] || 0, b.discountPercentage);
      }
    });
    return map;
  }, [activeBanners]);

  const isVideoUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return (
      url.startsWith("data:video/") ||
      url.endsWith(".mp4") ||
      url.endsWith(".webm") ||
      url.endsWith(".ogg") ||
      url.includes(".mp4") ||
      url.includes("video")
    );
  };

  const getBannerImage = (banner) => {
    if (!banner) return "";
    const imgPath = banner.desktopImage || banner.image;
    if (!imgPath) return "";
    if (imgPath.startsWith("data:") || imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }
    return `${BACKEND_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
  };

  const getMobileBannerImage = (banner) => {
    if (!banner) return "";
    const imgPath = banner.mobileImage || banner.image || banner.desktopImage;
    if (!imgPath) return "";
    if (imgPath.startsWith("data:") || imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }
    return `${BACKEND_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
  };

  const currentDesktopBanner = displayDesktopBanners.length > 0 ? displayDesktopBanners[currentSlideIndex % displayDesktopBanners.length] : null;
  const currentMobileBanner = displayMobileBanners.length > 0 ? displayMobileBanners[currentSlideIndex % displayMobileBanners.length] : null;

  const activeFloatingBanner = floatingBanners.length > 0
    ? floatingBanners[currentFloatingIndex % floatingBanners.length]
    : null;

  const nextSlide = useCallback(() => {
    const maxLen = Math.max(displayDesktopBanners.length, displayMobileBanners.length);
    if (maxLen <= 1) return;
    setCurrentSlideIndex(prev => (prev + 1) % maxLen);
  }, [displayDesktopBanners.length, displayMobileBanners.length]);

  const prevSlide = useCallback(() => {
    const maxLen = Math.max(displayDesktopBanners.length, displayMobileBanners.length);
    if (maxLen <= 1) return;
    setCurrentSlideIndex(prev => (prev - 1 + maxLen) % maxLen);
  }, [displayDesktopBanners.length, displayMobileBanners.length]);

  const nextFloatingSlide = useCallback(() => {
    if (floatingBanners.length <= 1) return;
    setCurrentFloatingIndex(prev => (prev + 1) % floatingBanners.length);
  }, [floatingBanners.length]);

  // Dynamic slide timer (100% precise duration)
  const currentBannerSeconds = React.useMemo(() => {
    const activeBannerWithTimer = activeBanners.find(b => b.durationSeconds && Number(b.durationSeconds) > 0);
    if (activeBannerWithTimer) {
      return Number(activeBannerWithTimer.durationSeconds);
    }
    const currentBanner = currentDesktopBanner || currentMobileBanner;
    if (currentBanner && currentBanner.durationSeconds && Number(currentBanner.durationSeconds) > 0) {
      return Number(currentBanner.durationSeconds);
    }
    return 5;
  }, [activeBanners, currentDesktopBanner, currentMobileBanner]);

  // Top Hero Auto-slide with precise setTimeout
  useEffect(() => {
    if (isTimerPaused) return; // Freeze timer on tap/click anywhere (WhatsApp status style)

    const maxLen = Math.max(displayDesktopBanners.length, displayMobileBanners.length);
    if (maxLen <= 1) return;

    const isCurrentVideo =
      isVideoUrl(getBannerImage(currentDesktopBanner)) ||
      isVideoUrl(getMobileBannerImage(currentMobileBanner));

    if (isCurrentVideo) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, currentBannerSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isTimerPaused, currentSlideIndex, currentBannerSeconds, displayDesktopBanners.length, displayMobileBanners.length, nextSlide]);

  // Filter bestsellers dynamically
  const filteredBestsellers = products.filter(p => {
    const isBestseller = p.bestseller || true; // Show all products since they are bestsellers in our seed!
    if (!isBestseller) return false;

    if (selectedBestsellerCategory === 'All Products') return true;
    if (selectedBestsellerCategory === 'Combos') {
      return p.category === 'Combos' || p.category === 'Gift Boxes';
    }
    return p.category === selectedBestsellerCategory;
  });

  // Scroll function for bestsellers carousel
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.75
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const fixImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    let fixed = url;
    if (fixed.includes('thekua.jpg')) fixed = fixed.replace('thekua.jpg', 'thekua.jpeg');
    if (fixed.includes('desi_cow_ghee.jpg')) fixed = fixed.replace('desi_cow_ghee.jpg', 'desi_cow_ghee.jpeg');
    if (fixed.startsWith('/uploads/')) return `${BACKEND_URL}${fixed}`;
    return fixed;
  };

  const categories = dynamicCategories;

  // Testimonials
  const testimonials = [
    {
      name: 'Ananya S.',
      role: 'Home Cook & Critic',
      rating: 5,
      comment: 'The mango pickle tastes exactly like homemade. Absolutely loved it!',
      city: 'Patna',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Rajiv K.',
      role: 'Gourmet Enthusiast',
      rating: 5,
      comment: 'Pure, natural and authentic. The aroma is divine!',
      city: 'Gaya',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Meera T.',
      role: 'Brand Manager',
      rating: 5,
      comment: 'Best ghee I have ever used. The texture is perfect.',
      city: 'Patna',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Pankaj V.',
      role: 'Daily Snack Buyer',
      rating: 5,
      comment: 'Perfect packaging and super fast delivery.',
      city: 'Bihar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    }
  ];

  // Instagram Social Gallery items with real product images & category links
  const socialGalleryItems = [
    {
      image: '/images/new_rs_ghee.webp',
      title: 'Pure A2 Desi Cow Ghee',
      category: 'Ghee',
      link: '/shop?category=Ghee'
    },
    {
      image: '/images/new_rs_pickle.webp',
      title: 'Traditional Mango Pickle',
      category: 'Pickles',
      link: '/shop?category=Pickles'
    },
    {
      image: '/images/thekua.jpeg',
      title: 'Homemade Bihari Thekua',
      category: 'Thekua',
      link: '/shop?category=Thekua'
    },
    {
      image: '/images/makhana.jpg',
      title: 'Mithila Roasted Makhana',
      category: 'Makhana',
      link: '/shop?category=Makhana'
    },
    {
      image: '/images/premium_combo_box.jpg',
      title: 'Festive Gift Collection',
      category: 'Gift Boxes',
      link: '/shop?category=Gift Boxes'
    },
    {
      image: '/images/nnew_rs_sattu.webp',
      title: 'Authentic Chana Sattu',
      category: 'Sattu',
      link: '/shop?category=Sattu'
    }
  ];

  return (
    <div className="pb-20 overflow-x-hidden">

      {/* Self-contained style for hiding scrollbars */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 1. Premium Hero Section */}

      {/* 1A. MOBILE VIEW: Dedicated Mobile Hero Layout */}
      {displayMobileBanners.length > 0 && (
        <div 
          onMouseDown={() => setIsTimerPaused(true)}
          onMouseUp={() => setIsTimerPaused(false)}
          onMouseLeave={() => setIsTimerPaused(false)}
          onTouchStart={() => setIsTimerPaused(true)}
          onTouchEnd={() => setIsTimerPaused(false)}
          className="block lg:hidden relative w-full overflow-hidden border-b border-brand-gold/15 bg-[#FAF6EF]"
        >
          <div className="relative w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {/* Mobile Banner Image / Video */}
                {getMobileBannerImage(currentMobileBanner) && (
                  isVideoUrl(getMobileBannerImage(currentMobileBanner)) ? (
                    <video
                      src={getMobileBannerImage(currentMobileBanner)}
                      autoPlay
                      muted
                      playsInline
                      onEnded={nextSlide}
                      className="w-full h-auto object-contain block cursor-pointer"
                      onClick={() => window.location.href = currentMobileBanner?.buttonLink || "/shop"}
                    />
                  ) : (
                    <img
                      src={getMobileBannerImage(currentMobileBanner)}
                      alt="ReetSutra Mobile Banner"
                      onError={(e) => handleFrontendImageError(e)}
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-auto object-contain block"
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {/* Buttons Overlay for Mobile View - Stacked vertically in empty space (Hidden for Video Banners) */}
            {!isVideoUrl(getMobileBannerImage(currentMobileBanner)) && (
              <div className="absolute left-[4%] xs:left-[4.5%] sm:left-[5%] bottom-[25%] xs:bottom-[26%] sm:bottom-[27%] z-20 flex flex-col items-start space-y-1.5 xs:space-y-2">
                {/* SHOP NOW Button (Top) */}
                <Link
                  to={currentMobileBanner?.buttonLink || "/shop"}
                  className="bg-[#143021] hover:bg-[#0E2317] text-[#C5972E] font-extrabold text-[9.5px] xs:text-[10.5px] tracking-[0.08em] uppercase py-1.5 px-3.5 xs:px-4 rounded shadow-xs flex items-center justify-center space-x-1 border border-[#C5972E]/40 active:scale-95 transition-all min-w-[125px] xs:min-w-[140px]"
                >
                  <span>{currentMobileBanner?.buttonText || "SHOP NOW"}</span>
                  <Leaf className="w-3 h-3 text-[#C5972E] fill-current shrink-0" />
                </Link>

                {/* EXPLORE COLLECTION Button (Below SHOP NOW) */}
                <Link
                  to={currentMobileBanner?.buttonLink || "/shop"}
                  className="bg-[#FAF6EF]/95 hover:bg-[#FAF6EF] border border-[#C5972E]/60 text-[#7A5822] font-extrabold text-[9.5px] xs:text-[10.5px] tracking-[0.08em] uppercase py-1.5 px-3.5 xs:px-4 rounded shadow-2xs flex items-center justify-center active:scale-95 transition-all min-w-[140px] xs:min-w-[155px]"
                >
                  <span>EXPLORE COLLECTION</span>
                </Link>
              </div>
            )}

            {/* Mobile Slider Controls & Dots */}
            {displayMobileBanners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#143021]/80 text-[#C5972E] border border-[#C5972E]/40 flex items-center justify-center shadow-md active:scale-95"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4 text-[#C5972E]" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#143021]/80 text-[#C5972E] border border-[#C5972E]/40 flex items-center justify-center shadow-md active:scale-95"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4 text-[#C5972E]" />
                </button>

                {/* Mobile Slide Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5">
                  {displayMobileBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        (currentSlideIndex % displayMobileBanners.length) === idx
                          ? "w-6 bg-[#C5972E]"
                          : "w-1.5 bg-[#143021]/40"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1B. DESKTOP VIEW: Clean Full-Width Banner Image / Video */}
      {displayDesktopBanners.length > 0 && (
        <section 
          onMouseDown={() => setIsTimerPaused(true)}
          onMouseUp={() => setIsTimerPaused(false)}
          onMouseLeave={() => setIsTimerPaused(false)}
          onTouchStart={() => setIsTimerPaused(true)}
          onTouchEnd={() => setIsTimerPaused(false)}
          className="hidden lg:block relative w-full overflow-hidden border-b border-brand-gold/15 bg-[#FAF6EF]"
        >
          <div className="relative w-full overflow-hidden min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {getBannerImage(currentDesktopBanner) && (
                  isVideoUrl(getBannerImage(currentDesktopBanner)) ? (
                    <video
                      src={getBannerImage(currentDesktopBanner)}
                      autoPlay
                      muted
                      playsInline
                      onEnded={nextSlide}
                      className="w-full h-auto object-contain block cursor-pointer"
                      onClick={() => window.location.href = currentDesktopBanner?.buttonLink || "/shop"}
                    />
                  ) : (
                    <img
                      src={getBannerImage(currentDesktopBanner)}
                      alt="ReetSutra Desktop Banner"
                      onError={(e) => handleFrontendImageError(e)}
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-auto object-contain block"
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {/* Overlay Buttons for Desktop Banner (Hidden for Video Banners) */}
            {!isVideoUrl(getBannerImage(currentDesktopBanner)) && (
              <div className="absolute left-[5%] lg:left-[6%] xl:left-[6.5%] bottom-[15%] lg:bottom-[16.5%] xl:bottom-[18%] z-20 flex flex-row items-center space-x-3.5 lg:space-x-4 xl:space-x-5">
                {/* SHOP NOW Button */}
                <Link
                  to={currentDesktopBanner?.buttonLink || "/shop"}
                  className="bg-[#143021] hover:bg-[#0A1A12] text-[#C5972E] font-extrabold text-xs lg:text-sm xl:text-[15px] tracking-[0.1em] uppercase py-2.5 lg:py-3.5 xl:py-4 px-6 lg:px-8 xl:px-10 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 flex items-center justify-center space-x-2 border border-[#C5972E]/50 cursor-pointer active:scale-95 min-w-[165px] lg:min-w-[200px] xl:min-w-[225px]"
                >
                  <span>{currentDesktopBanner?.buttonText || "SHOP NOW"}</span>
                  <Leaf className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 text-[#C5972E] fill-current shrink-0" />
                </Link>

                {/* EXPLORE COLLECTION Button */}
                <Link
                  to={currentDesktopBanner?.buttonLink || "/shop"}
                  className="bg-[#FAF6EF]/95 hover:bg-[#FAF6EF] text-[#7A5822] hover:text-[#4A3412] font-extrabold text-xs lg:text-sm xl:text-[15px] tracking-[0.1em] uppercase py-2.5 lg:py-3.5 xl:py-4 px-6 lg:px-8 xl:px-10 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300 flex items-center justify-center space-x-2 border-2 border-[#C5972E]/70 cursor-pointer active:scale-95 min-w-[190px] lg:min-w-[230px] xl:min-w-[260px]"
                >
                  <span>EXPLORE COLLECTION</span>
                </Link>
              </div>
            )}

            {/* Desktop Slider Controls & Dots */}
            {displayDesktopBanners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#143021]/80 hover:bg-[#143021] text-[#C5972E] border border-[#C5972E]/40 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5 text-[#C5972E]" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#143021]/80 hover:bg-[#143021] text-[#C5972E] border border-[#C5972E]/40 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5 text-[#C5972E]" />
                </button>

                {/* Slide Indicators (- - - - - -) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
                  {displayDesktopBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        (currentSlideIndex % displayDesktopBanners.length) === idx
                          ? "w-8 bg-[#C5972E] shadow-sm"
                          : "w-2 bg-[#143021]/30 hover:bg-[#143021]/60"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 1.3 Under-Hero 6-Feature Bar - Light ivory cream background, gold dividers, matching reference image */}
      <section className="bg-[#FAF6EF] border-y border-[#B8934E]/20 py-5 sm:py-6 px-3 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-6 md:gap-y-0 gap-x-2 sm:gap-x-4">
            {[
              {
                icon: SmallBatchesIcon,
                title1: "HANDMADE",
                title2: "IN SMALL BATCHES",
                subtitle: "Made with Love"
              },
              {
                icon: BiharRecipesIcon,
                title1: "TRADITIONAL",
                title2: "BIHAR RECIPES",
                subtitle: "Passed Down Generations"
              },
              {
                icon: PremiumIngredientsIcon,
                title1: "PREMIUM",
                title2: "INGREDIENTS",
                subtitle: "Finest Quality"
              },
              {
                icon: NoPreservativesIcon,
                title1: "NO ARTIFICIAL",
                title2: "PRESERVATIVES",
                subtitle: "100% Natural"
              },
              {
                icon: PrideInBiharIcon,
                title1: "MADE WITH PRIDE",
                title2: "IN BIHAR",
                subtitle: "From Our Roots to You"
              },
              {
                icon: FreshShieldIcon,
                title1: "FRESHLY",
                title2: "PACKED",
                subtitle: "For Purity & Taste"
              }
            ].map((feat, idx, arr) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-start gap-2.5 sm:gap-3 py-1.5 px-1 sm:px-2 text-left w-full max-w-[200px] xs:max-w-[220px] mx-auto ${idx !== arr.length - 1 ? 'lg:border-r lg:border-[#B8934E]/25' : ''
                    }`}
                >
                  <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <IconComp />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="font-extrabold text-[9.5px] xs:text-[10px] sm:text-[11px] text-[#1E3926] tracking-wider uppercase leading-tight font-sans">
                      {feat.title1}
                      <span className="block">{feat.title2}</span>
                    </h4>
                    <p className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] text-[#8C6D34] font-serif italic mt-0.5 leading-none">
                      {feat.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spaced container for subsequent sections */}
      <div className="space-y-16 md:space-y-20 mt-16 md:mt-20">

        {/* 2. Featured Categories Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
              EXPLORE OUR COLLECTION
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
              Explore Our Collection
            </h2>
            <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-4">
            {categories.map((cat, idx) => {
              const catNorm = (cat.name || "").toLowerCase().trim();
              const offerPct = categoryFloatingOffers[catNorm] || categoryFloatingOffers["all categories"] || categoryFloatingOffers["all products"] || 0;

              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex flex-col items-center"
                >
                  <Link
                    to={`/shop?category=${cat.name}`}
                    className="group flex flex-col items-center space-y-3 w-full"
                  >
                    <div className="relative aspect-square w-24 rounded-full border border-brand-gold/20 group-hover:border-brand-gold p-1 bg-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                      {offerPct > 0 && (
                        <span className="absolute -top-1 -right-1 z-20 bg-amber-600 text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-white animate-pulse">
                          🔥 {offerPct}% OFF
                        </span>
                      )}
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img
                          src={fixImageUrl(cat.image)}
                          alt={cat.name}
                          onError={handleFrontendImageError}
                          className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-bold text-xs text-brand-green font-serif group-hover:text-brand-gold transition-colors truncate">
                        {cat.displayName || cat.name}
                      </h3>
                      {offerPct > 0 ? (
                        <span className="text-[9.5px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs block truncate">
                          🔥 {offerPct}% OFF OFFER
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-brand-gold hover:text-brand-green tracking-wider uppercase flex items-center justify-center gap-0.5">
                          <span>Shop Now</span>
                          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. Best Sellers Section with Horizontal Carousel */}
        <section className="bg-[#FAF7F2] border-y border-brand-gold/15 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            <div className="text-center space-y-4">
              <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
                PEOPLE'S FAVORITES
              </span>
              {/* Heading with gold lines and ornaments */}
              <div className="flex items-center justify-center space-x-4">
                <div className="h-[1px] bg-brand-gold/40 w-12 md:w-24" />
                <span className="text-brand-gold text-xs md:text-sm">✦</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
                  Shop Our Bestsellers
                </h2>
                <span className="text-brand-gold text-xs md:text-sm">✦</span>
                <div className="h-[1px] bg-brand-gold/40 w-12 md:w-24" />
              </div>
            </div>

            {/* Bestseller Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 py-2 border-b border-brand-creamDark max-w-3xl mx-auto">
              {bestsellerCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedBestsellerCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${selectedBestsellerCategory === cat
                    ? 'bg-brand-green text-brand-cream shadow-sm scale-105'
                    : 'bg-brand-cream/45 border border-brand-gold/15 text-brand-green hover:bg-brand-cream'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Horizontal Carousel Container */}
            <div className="relative px-2 md:px-4">
              {/* Left Scroll Button */}
              <button
                onClick={() => scroll('left')}
                className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-brand-cream text-brand-gold border border-brand-gold/30 hover:border-brand-gold p-2.5 rounded-full shadow-md hover:scale-110 transition-all duration-300 cursor-pointer hidden md:flex items-center justify-center"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Scroll Button */}
              <button
                onClick={() => scroll('right')}
                className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-brand-cream text-brand-gold border border-brand-gold/30 hover:border-brand-gold p-2.5 rounded-full shadow-md hover:scale-110 transition-all duration-300 cursor-pointer hidden md:flex items-center justify-center"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Scroll Area */}
              <div
                ref={scrollRef}
                className="no-scrollbar flex space-x-6 overflow-x-auto scroll-smooth py-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredBestsellers.map((product) => (
                  <div key={product.id} className="w-[280px] shrink-0 snap-start">
                    <ProductCard
                      product={product}
                      onQuickView={(p) => setQuickViewProduct(p)}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 4. Why ReetSutra Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
              OUR PRINCIPLES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
              The ReetSutra Guarantee
            </h2>
            <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1 */}
            <div className="bg-brand-ivory p-8 rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-all text-center space-y-4 shadow-premium">
              <div className="w-12 h-12 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif">
                Natural Ingredients
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                No artificial chemical preservatives, food colorings, or refined sugars. We use pure organic sugarcane jaggery (gur) and cold-ground spices.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-brand-ivory p-8 rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-all text-center space-y-4 shadow-premium">
              <div className="w-12 h-12 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-md">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif">
                Handmade With Love
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                All recipes are prepared in small batches by local self-help women collectives using traditional wooden templates (Saancha) and mortar tools.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-brand-ivory p-8 rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-all text-center space-y-4 shadow-premium">
              <div className="w-12 h-12 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif">
                Authentic Recipes
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                No compromises on flavor. We strictly preserve age-old spices and cooking dynamics handed down through grandma generations.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-brand-ivory p-8 rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-all text-center space-y-4 shadow-premium">
              <div className="w-12 h-12 rounded-full bg-brand-green text-brand-gold flex items-center justify-center mx-auto shadow-md">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif">
                Made With Love & Pride
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                We proudly celebrate India's rich food heritage—from layered Khajas to hand-pounded Tilkuts and the finest Makhana harvested from pristine fields.
              </p>
            </div>

          </div>

        </section>

        {/* 5. Brand Heritage & Gifts Split Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Card: Bihar's Kitchens */}
            <div className="bg-brand-green text-brand-cream rounded-lg overflow-hidden flex flex-col justify-between border border-brand-gold/15 shadow-2xl relative min-h-[420px]">
              <div className="absolute inset-0 z-0">
                <img
                  src={settings?.ourStoryImage ? (
                    (settings.ourStoryImage.startsWith('http://') || settings.ourStoryImage.startsWith('https://') || settings.ourStoryImage.startsWith('data:'))
                      ? settings.ourStoryImage
                      : `${BACKEND_URL}${settings.ourStoryImage.startsWith('/') ? '' : '/'}${settings.ourStoryImage}`
                  ) : storyImage}
                  alt="From Bihar's Kitchens"
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/70 to-transparent" />
              </div>

              <div className="p-8 md:p-10 space-y-6 relative z-10 my-auto flex flex-col items-start justify-center h-full">
                <span className="text-[10px] text-brand-gold font-bold tracking-[0.25em] uppercase">
                  {settings?.ourStorySubtitle || "HERITAGE & TRADITION"}
                </span>
                <h2 className="text-3xl font-extrabold font-serif leading-tight">
                  {settings?.ourStoryTitle || "From Bihar's Kitchens \nto Your Home"}
                </h2>
                <p className="text-xs md:text-sm text-brand-cream/80 leading-relaxed font-sans font-medium max-w-md">
                  {settings?.ourStoryDescription || "Our recipes have been passed down through generations. Every jar is prepared with patience, purity and love."}
                </p>
                <Link
                  to="/about"
                  className="inline-block bg-transparent hover:bg-brand-cream/10 border border-brand-gold text-brand-gold hover:text-brand-cream font-bold text-xs tracking-widest uppercase py-3 px-6 rounded transition-all duration-300"
                >
                  Our Story
                </Link>
              </div>
            </div>

            {/* Right Card: Premium Gift Collections */}
            <div className="bg-brand-ivory text-brand-green rounded-lg overflow-hidden border border-brand-gold/15 shadow-2xl p-8 md:p-10 flex flex-col md:flex-row gap-6 justify-between items-center min-h-[420px]">
              <div className="space-y-6 flex-1 text-left w-full">
                <span className="text-[10px] text-brand-gold font-bold tracking-[0.25em] uppercase block">
                  CURATED FOR CELEBRATIONS
                </span>
                <h2 className="text-3xl font-extrabold font-serif leading-tight text-brand-green">
                  Premium Gift <br />Collections
                </h2>
                <p className="text-xs md:text-sm text-brand-charcoalLight/90 leading-normal font-sans font-medium">
                  Perfect for Every Occasion
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-creamDark w-full">
                  {[
                    { name: "Wedding Gifts", path: "/shop?category=Gift Boxes" },
                    { name: "Corporate Gifts", path: "/shop?category=Gift Boxes" },
                    { name: "Festive Collection", path: "/shop?category=Gift Boxes" },
                    { name: "Luxury Boxes", path: "/shop?category=Gift Boxes" }
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.path}
                      className="group flex items-center justify-between border-b border-brand-creamDark pb-2.5 pr-2 hover:border-brand-gold transition-all duration-300 cursor-pointer"
                    >
                      <span className="font-bold text-xs uppercase tracking-wider text-brand-green group-hover:text-brand-gold transition-colors flex items-center gap-1.5">
                        {item.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-gold opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="w-44 h-44 md:w-52 md:h-52 shrink-0 relative rounded-lg overflow-hidden border border-brand-gold/15 bg-white shadow-md">
                <img
                  src="/images/premium_combo_box.jpg"
                  alt="Premium Gift Box"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 6. Traditional Bihar Heritage Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
              CULTURAL GEOGRAPHY
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
              Traditional Bihar Heritage
            </h2>
            <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Heritage Item 1: Traditional Thekua */}
            <Link to="/shop?category=Thekua" className="group space-y-4 text-left block cursor-pointer">
              <div className="aspect-[4/3] rounded overflow-hidden shadow-md border border-brand-gold/15 bg-white group-hover:border-brand-gold transition-all duration-300">
                <img
                  src="/images/thekua.jpeg"
                  alt="Authentic Thekua"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif group-hover:text-brand-gold transition-colors flex items-center justify-between">
                <span>Authentic Thekua & Sweets</span>
                <ArrowRight className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                Handmade traditional Thekua prepared using pure organic jaggery (gur), whole wheat, cardamoms, and fried in pure desi ghee using traditional carved wooden molds (Saancha).
              </p>
            </Link>

            {/* Heritage Item 2: Pure Desi Cow Ghee */}
            <Link to="/shop?category=Ghee" className="group space-y-4 text-left block cursor-pointer">
              <div className="aspect-[4/3] rounded overflow-hidden shadow-md border border-brand-gold/15 bg-white group-hover:border-brand-gold transition-all duration-300">
                <img
                  src="/images/desi_cow_ghee.jpeg"
                  alt="Pure A2 Desi Cow Ghee"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif group-hover:text-brand-gold transition-colors flex items-center justify-between">
                <span>Pure A2 Desi Cow Ghee</span>
                <ArrowRight className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                Crafted from grass-fed cow milk using traditional methods. Rich granular texture, natural aroma, and essential healthy fats handed down through traditional Indian kitchen heritage.
              </p>
            </Link>

            {/* Heritage Item 3: Mithila Premium Makhana */}
            <Link to="/shop?category=Makhana" className="group space-y-4 text-left block cursor-pointer">
              <div className="aspect-[4/3] rounded overflow-hidden shadow-md border border-brand-gold/15 bg-white group-hover:border-brand-gold transition-all duration-300">
                <img
                  src="/images/makhana.jpg"
                  alt="Mithila Premium Fox Nuts"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-lg font-bold text-brand-green font-serif group-hover:text-brand-gold transition-colors flex items-center justify-between">
                <span>Mithila Premium Fox Nuts (Makhana)</span>
                <ArrowRight className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans">
                Mithila produces over 85% of the world's makhana. Sourced from organic water lily farms, the seeds are harvested, sun-dried, and hand-popped on wood fire pans to create large, crunchy puff snacks.
              </p>
            </Link>

          </div>

        </section>

        {/* 7. Verified Real Customer Reviews Section */}
        <section className="bg-brand-ivory border-y border-brand-gold/15 py-20 px-4">
          <div className="max-w-7xl mx-auto space-y-12">

            <div className="text-center space-y-2">
              <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
                VERIFIED CUSTOMER REVIEWS
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
                Loved by Real Customers
              </h2>
              <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
            </div>

            {customerReviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerReviews.slice(0, 6).map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-white p-6 rounded-lg shadow-premium border border-brand-gold/10 flex flex-col justify-between items-center text-center space-y-4"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-gold/30 bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-lg">
                        {rev.userAvatar && !rev.userAvatar.includes('unsplash') ? (
                          <img src={rev.userAvatar} alt={rev.userName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{rev.userName ? rev.userName.charAt(0).toUpperCase() : 'C'}</span>
                        )}
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center text-brand-gold">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>

                      <p className="text-xs md:text-sm text-brand-charcoalLight font-sans italic leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-brand-creamDark w-full">
                      <h4 className="font-bold text-xs text-brand-green font-serif">{rev.userName}</h4>
                      {rev.productId && (
                        <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider mt-0.5">
                          Verified Buyer • {rev.productId.title || "Vrindesha Delicacy"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 sm:p-12 rounded-xl shadow-md border border-brand-gold/20 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-brand-gold/30">
                  <Star className="w-6 h-6 text-brand-gold fill-current" />
                </div>
                <h3 className="text-xl font-extrabold text-brand-green font-serif">
                  Be the First Verified Customer to Write a Review!
                </h3>
                <p className="text-xs sm:text-sm text-brand-charcoalLight leading-relaxed">
                  We display 100% real, authentic customer reviews. Try our organic products at home, and share your experience with food lovers!
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-green hover:bg-[#0E2317] text-brand-gold font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                >
                  <span>Explore Products & Leave a Review</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold" />
                </Link>
              </div>
            )}

          </div>
        </section>

        {/* 8. Instagram Style Gallery */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <div className="text-center space-y-2">
            <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
              SOCIAL GALLERY
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green serif-header">
              #ReetSutraLoves
            </h2>
            <p className="text-xs md:text-sm text-brand-charcoalLight font-sans">
              Tag us on Instagram with your family tea-time layouts to get featured.
            </p>
            <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {socialGalleryItems.map((item, i) => (
              <Link
                key={i}
                to={item.link}
                className="relative aspect-square overflow-hidden rounded-lg border border-brand-gold/15 group shadow-sm hover:shadow-premium block cursor-pointer bg-white"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-green/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-brand-gold text-[10px] font-bold tracking-widest uppercase mb-1">
                    {item.category}
                  </span>
                  <span className="text-brand-cream text-[11px] font-bold uppercase tracking-wider font-sans border border-brand-gold/40 px-3 py-1 bg-brand-green/40 backdrop-blur-xs rounded shadow-xs">
                    View Post
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </section>

      </div>



      {/* Quick View Modal Overlay */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

    </div>
  );
}
