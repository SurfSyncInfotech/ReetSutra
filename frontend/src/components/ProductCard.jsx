import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingCart, Bell } from 'lucide-react';
import { useReetSutra } from '../context/ReetSutraContext';
import { motion } from 'framer-motion';
import NotifyMeModal from './NotifyMeModal';
import { handleFrontendImageError } from '../config';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, toggleWishlist, isInWishlist, settings } = useReetSutra();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const displayPrice = product.price;
  const originalPrice = product.originalPrice || product.compareAtPrice;
  const availableStock = product.available !== undefined ? product.available : Math.max(0, (product.stock || 0) - (product.blockedInOrders || 0));
  const isOutOfStock = product.stock <= 0 || availableStock <= 0 || product.status === "Inactive";

  const catName = product?.categoryName || (typeof product?.category === 'string' ? product.category : product?.category?.name) || '';
  const normCat = catName.toLowerCase().trim();
  const isSampleProduct = normCat === 'sample' || normCat === 'sample products' || normCat === 'samples' || normCat.includes('sample') || product?.isSample || product?.price === 0;

  const isFreeSampleActive = settings?.freeSampleOffer !== false && settings?.freeSampleOffer !== 'false' && settings?.freeSampleOffer !== 0 && settings?.freeSampleOffer !== 'disabled';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      setIsNotifyOpen(true);
      return;
    }
    addToCart(product.id, 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleNotifyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNotifyOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="group relative bg-brand-ivory rounded-lg overflow-hidden shadow-premium hover:shadow-premium-hover border border-brand-gold/10 transition-all duration-300 flex flex-col h-full"
      >
        
        {/* Product Image Area */}
        <div className="relative aspect-square overflow-hidden bg-brand-cream/40">
          
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 items-start">
            {isOutOfStock && (
              <span className="bg-rose-700 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 uppercase rounded-sm shadow-sm">
                Out of Stock
              </span>
            )}
            {isFreeSampleActive && !isSampleProduct && !isOutOfStock && (
              <span className="bg-[#143021] text-[#C5972E] text-[9px] font-extrabold tracking-wider px-2 py-0.5 uppercase rounded-sm shadow-xs border border-[#C5972E]/40 flex items-center gap-1">
                🎁 FREE SAMPLE GIFT
              </span>
            )}
            {product.bestseller && !isOutOfStock && (
              <span className="bg-brand-green text-brand-cream text-[9px] font-semibold tracking-wider px-2 py-0.5 uppercase rounded-sm">
                Bestseller
              </span>
            )}
            {product.discount > 0 && (
              <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 uppercase rounded-sm shadow-xs ${
                product.hasFloatingOffer ? 'bg-amber-600 text-white animate-pulse' : 'bg-brand-gold text-brand-green'
              }`}>
                {product.hasFloatingOffer ? `🔥 ${product.discount}% OFF` : `${product.discount}% OFF`}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full border shadow-sm transition-all duration-300 hover:scale-110 ${
              inWishlist 
                ? 'bg-red-50 border-red-200 text-red-500' 
                : 'bg-white/85 backdrop-blur-sm border-brand-gold/20 text-brand-green hover:text-red-500'
            }`}
            aria-label="Add to Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Image with direct link to Product Details Page */}
          <Link 
            to={`/product/${product.id}`} 
            className="block w-full h-full cursor-pointer"
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={handleFrontendImageError}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale-30 opacity-90' : ''}`}
            />
          </Link>

          {/* Hover Overlay Actions */}
          <div className="absolute inset-0 bg-brand-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3 pointer-events-none">
            
            <Link
              to={`/product/${product.id}`}
              className="p-3 bg-brand-ivory text-brand-green hover:bg-brand-gold hover:text-brand-green rounded-full shadow-md transition-all duration-300 hover:scale-110 pointer-events-auto cursor-pointer"
              title="View Product Details"
            >
              <Eye className="w-5 h-5" />
            </Link>

            {!isOutOfStock ? (
              <button
                onClick={handleAddToCart}
                className="p-3 bg-brand-green text-brand-cream hover:bg-brand-gold hover:text-brand-green rounded-full shadow-md transition-all duration-300 hover:scale-110 pointer-events-auto cursor-pointer"
                title="Add to Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsNotifyOpen(true)}
                className="p-3 bg-rose-800 text-white hover:bg-rose-900 rounded-full shadow-md transition-all duration-300 hover:scale-110 pointer-events-auto cursor-pointer"
                title="Notify Me When Available"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}

          </div>

        </div>

        {/* Product Info Area */}
        <div className="p-4 flex-1 flex flex-col justify-between text-center items-center">
          <div className="space-y-1.5 flex flex-col items-center w-full">
            {/* Category */}
            <span className="text-[9px] text-brand-gold font-sans tracking-[0.2em] uppercase font-bold">
              {product.category}
            </span>
   
            {/* Title */}
            <Link 
              to={`/product/${product.id}`}
              className="block text-sm md:text-base font-extrabold text-brand-green font-serif hover:text-brand-gold transition-colors duration-200 line-clamp-1 w-full"
            >
              {product.name}
            </Link>
   
            {/* Subtitle / Tagline */}
            <p className="text-[11px] text-brand-charcoalLight/80 font-sans font-medium line-clamp-1 leading-normal">
              {product.tagline}
            </p>
   
            {/* Price */}
            <div className="flex items-center justify-center space-x-2 pt-1.5">
              <span className="text-sm md:text-base font-bold text-[#A27A30]">
                ₹{displayPrice}
              </span>
              {originalPrice && (
                <span className="text-xs text-brand-charcoalLight/65 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
          </div>
   
          {/* Action Button: ADD TO CART vs NOTIFY ME */}
          <div className="pt-3 w-full">
            {!isOutOfStock ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#A27A30] hover:bg-[#8F6B28] text-white py-1 pl-4 pr-1 rounded-md font-sans text-[11px] font-extrabold tracking-widest uppercase transition-all duration-300 flex items-center justify-between cursor-pointer shadow-sm hover:scale-[1.01]"
              >
                <span>ADD TO CART</span>
                <div className="w-7 h-7 rounded-full bg-brand-green text-[#C8A25D] flex items-center justify-center shrink-0 ml-2 shadow-sm">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#C8A25D]" />
                </div>
              </button>
            ) : (
              <button
                onClick={handleNotifyClick}
                className="w-full bg-[#143021] hover:bg-[#0E2317] text-[#C5972E] py-1 pl-3 pr-1 rounded-md font-sans text-[10.5px] font-extrabold tracking-wider uppercase transition-all duration-300 flex items-center justify-between cursor-pointer shadow-sm border border-[#C5972E]/40 hover:scale-[1.01]"
              >
                <span>NOTIFY ME 🔔</span>
                <div className="w-7 h-7 rounded-full bg-[#C5972E] text-[#143021] flex items-center justify-center shrink-0 ml-2 shadow-sm">
                  <Bell className="w-3.5 h-3.5 text-[#143021] fill-current" />
                </div>
              </button>
            )}
          </div>

        </div>

      </motion.div>

      {/* Notify Me Modal */}
      <NotifyMeModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        product={product}
      />
    </>
  );
}
