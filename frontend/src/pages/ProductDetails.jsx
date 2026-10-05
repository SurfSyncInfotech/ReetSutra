import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReetSutra } from '../context/ReetSutraContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { handleFrontendImageError } from '../config';
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  ShieldCheck, 
  RotateCcw, 
  Truck,
  MessageSquare,
  Sparkles,
  Play,
  Bell,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config';
import NotifyMeModal from '../components/NotifyMeModal';

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, addToCart, toggleWishlist, isInWishlist, user, fetchProducts, showToast, settings } = useReetSutra();
  const [quantity, setQuantity] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  
  // Reviews dynamic states
  const reviewsRef = React.useRef(null);
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setIsReviewsLoading(true);
      const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const activeToken = localStorage.getItem("rs_token");
      const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Review submitted successfully!", "success");
        setNewComment('');
        setNewRating(5);
        loadReviews();
        fetchProducts(); // Refresh overall rating in catalog
      } else {
        showToast(data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Error submitting review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      const activeToken = localStorage.getItem("rs_token");
      const res = await fetch(`${API_BASE_URL}/products/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Review deleted successfully.", "success");
        loadReviews();
        fetchProducts(); // Refresh overall rating in catalog
      } else {
        showToast(data.message || "Failed to delete review.");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      showToast("Error deleting review.");
    }
  };
  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    ingredients: false,
    storage: false,
    nutrition: false,
    shipping: false,
    reviews: false
  });

  const toggleAccordion = (sec) => {
    setOpenAccordions(prev => ({
      ...prev,
      [sec]: !prev[sec]
    }));
  };

  // Find product
  const product = products.find(p => String(p.id || p._id) === String(id));

  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [isVideoSelected, setIsVideoSelected] = useState(false);

  // Scroll to top strictly when product ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
  }, [id]);

  // Sync selected image and load reviews when product loads
  useEffect(() => {
    if (product) {
      setSelectedImage(prev => prev || product.image);
      setIsVideoSelected(false);
      loadReviews();
    }
  }, [product?.id, product?._id, loadReviews]);

  // Combine primary image and additional gallery images without duplicates
  const allImages = React.useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-brand-green">Delicacy Not Found</h2>
        <p className="text-xs md:text-sm text-brand-charcoalLight">The product you are trying to view does not exist in our heritage database.</p>
        <Link to="/shop" className="inline-block bg-brand-green text-brand-cream px-6 py-2 rounded text-xs font-bold uppercase tracking-widest">
          Go To Shop
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discountedPrice = Math.round(product.price * (1 - product.discount / 100));

  // Filter 3 related products (same category, excluding current product)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  // If no related products in same category, show best sellers
  const displayRelated = relatedProducts.length > 0 
    ? relatedProducts 
    : products.filter(p => p.bestseller && p.id !== product.id).slice(0, 3);

  const adjustQuantity = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  };

  // Dynamic reviews loaded from database
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewCount).toFixed(1)) 
    : 0;

  const scrollToReviews = () => {
    setOpenAccordions(prev => ({ ...prev, reviews: true }));
    setTimeout(() => {
      if (reviewsRef.current) {
        reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Product Large Image & Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border border-brand-gold/15 bg-white shadow-premium">
            {isVideoSelected && product.video ? (
              <video
                src={product.video}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <img
                src={selectedImage || product.image}
                alt={product.name}
                onError={handleFrontendImageError}
                className="w-full h-full object-cover transition-all duration-300"
              />
            )}
            {!isVideoSelected && product.bestseller && (
              <span className="absolute top-4 left-4 bg-brand-green text-brand-cream text-xs font-bold tracking-widest px-3 py-1 uppercase rounded-sm shadow-md">
                Bestseller
              </span>
            )}
            {!isVideoSelected && product.discount > 0 && (
              <span className="absolute top-4 right-4 bg-brand-gold text-brand-green text-xs font-bold tracking-widest px-3 py-1 uppercase rounded-sm shadow-md">
                {product.discount}% OFF
              </span>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {(allImages.length > 1 || product.video) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {allImages.map((img, idx) => {
                const isSelected = !isVideoSelected && (selectedImage ? selectedImage === img : idx === 0);
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedImage(img); setIsVideoSelected(false); }}
                    title={`View image ${idx + 1}`}
                    className={`w-16 h-16 rounded border overflow-hidden transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-brand-gold ring-2 ring-brand-gold/60 shadow-sm scale-105'
                        : 'border-brand-gold/20 hover:border-brand-gold/60 bg-white opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} gallery ${idx + 1}`}
                      onError={(e) => {
                        const btn = e.target.closest('button');
                        const currentSrc = e.target.src || '';
                        if (currentSrc && currentSrc.includes('/uploads/') && !currentSrc.startsWith('https://backend.reetsutra.com')) {
                          const relativePath = currentSrc.substring(currentSrc.indexOf('/uploads/'));
                          e.target.src = `https://backend.reetsutra.com${relativePath}`;
                        } else if (btn) {
                          btn.style.display = 'none';
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
              {product.video && (
                <button
                  onClick={() => setIsVideoSelected(true)}
                  title="Play product video"
                  className={`relative w-16 h-16 rounded border overflow-hidden transition-all duration-200 cursor-pointer ${
                    isVideoSelected
                      ? 'border-brand-gold ring-2 ring-brand-gold/60 shadow-sm scale-105'
                      : 'border-brand-gold/20 hover:border-brand-gold/60 bg-white opacity-80 hover:opacity-100'
                  }`}
                >
                  <video src={product.video} className="w-full h-full object-cover" muted />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={18} className="text-white" fill="white" />
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Product Buy Details */}
        <div className="space-y-6">
          
          <div className="space-y-2">
            {/* Category */}
            <span className="text-xs text-brand-gold uppercase tracking-[0.25em] font-black">
              {product.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-green font-serif leading-tight">
              {product.name}
            </h1>

            {/* Tagline */}
            <p className="text-sm md:text-base text-brand-gold font-serif italic">
              "{product.tagline}"
            </p>

            {/* Rating summary */}
            <div 
              onClick={scrollToReviews}
              className="flex items-center space-x-2 pt-1 cursor-pointer hover:opacity-85 transition-all group"
              title="Click to view customer reviews"
            >
              <div className="flex items-center text-brand-gold">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4.5 h-4.5 ${i < Math.floor(avgRating) ? 'fill-current' : 'opacity-30'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-brand-charcoalLight font-semibold group-hover:text-brand-green group-hover:underline underline-offset-2">
                ({reviewCount} {reviewCount === 1 ? 'customer review' : 'customer reviews'})
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-4 border-y border-brand-creamDark py-4">
            <span className="text-2xl md:text-3xl font-black text-brand-green">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-sm md:text-base text-brand-charcoalLight line-through">
                  ₹{product.originalPrice}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${product.hasFloatingOffer ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-brand-gold bg-brand-gold/10'}`}>
                  SAVE ₹{product.originalPrice - product.price} ({product.discount}% OFF)
                </span>
              </>
            )}
            <span className="text-xs text-brand-charcoalLight ml-auto">
              Net Content: <span className="font-bold text-brand-green">{product.weight}</span>
            </span>
          </div>

          {/* Short description if present */}
          {product.shortDescription && (
            <div className="text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans font-medium bg-brand-cream/35 border-l-2 border-brand-gold pl-3 py-2.5 whitespace-pre-line">
              {product.shortDescription}
            </div>
          )}

          {/* Quality badges */}
          <div className="flex flex-wrap gap-2.5 py-1 text-[10px] md:text-xs text-brand-green font-bold">
            <span className="flex items-center gap-1 bg-brand-cream/35 border border-brand-gold/15 px-2.5 py-1.5 rounded-full select-none">
              🍃 No Preservatives
            </span>
            <span className="flex items-center gap-1 bg-brand-cream/35 border border-brand-gold/15 px-2.5 py-1.5 rounded-full select-none">
              📜 Traditional Recipe
            </span>
            <span className="flex items-center gap-1 bg-brand-cream/35 border border-brand-gold/15 px-2.5 py-1.5 rounded-full select-none">
              🥣 Small Batches
            </span>
          </div>

          {/* Dynamic Free Sample Offer Banner for Regular Products */}
          {(() => {
            const catName = product?.categoryName || (typeof product?.category === 'string' ? product.category : product?.category?.name) || '';
            const normCat = catName.toLowerCase().trim();
            const isSampleProduct = normCat === 'sample' || normCat === 'sample products' || normCat === 'samples' || normCat.includes('sample') || product?.isSample || product?.price === 0;
            const isFreeSampleActive = settings?.freeSampleOffer !== false && settings?.freeSampleOffer !== 'false' && settings?.freeSampleOffer !== 0 && settings?.freeSampleOffer !== 'disabled';

            if (!isFreeSampleActive || isSampleProduct) return null;

            return (
              <div className="bg-[#143021]/10 border border-[#C5972E]/40 rounded-lg p-3.5 flex items-center space-x-3 text-xs text-[#143021] my-3">
                <Gift className="w-5 h-5 text-[#C5972E] shrink-0" />
                <div>
                  <span className="font-serif font-bold text-[#143021] block text-sm">🎁 FREE SAMPLE GIFT OFFER</span>
                  <span className="text-[11px] text-brand-charcoalLight/90">Select 1 free sample product (₹0) during checkout with this order!</span>
                </div>
              </div>
            );
          })()}

          {/* Selection Actions */}
          {(() => {
            const availStock = product.available !== undefined ? product.available : Math.max(0, (product.stock || 0) - (product.blockedInOrders || 0));
            const isProdOutOfStock = product.stock <= 0 || availStock <= 0 || product.status === "Inactive";

            return (
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {!isProdOutOfStock ? (
                <>
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between border border-brand-gold/30 rounded w-full sm:w-32 bg-white">
                    <button 
                      onClick={() => adjustQuantity(-1)}
                      className="px-4 py-3 text-brand-green hover:bg-brand-cream text-lg font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-brand-green">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => adjustQuantity(1)}
                      className="px-4 py-3 text-brand-green hover:bg-brand-cream text-lg font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add To Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-brand-green hover:bg-brand-greenDark text-brand-cream py-3.5 px-4 rounded font-sans text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center space-x-1.5 shadow-gold-glow cursor-pointer"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span>Add To Cart</span>
                  </button>

                  {/* Buy Now CTA */}
                  <button
                    onClick={() => {
                      if (!user || !user.isLoggedIn) {
                        showToast('Please login to complete your purchase.');
                        navigate('/login');
                      } else {
                        navigate('/checkout', {
                          state: {
                            buyNowItem: {
                              product,
                              quantity
                            }
                          }
                        });
                      }
                    }}
                    className="flex-1 bg-brand-gold hover:bg-brand-goldDark text-brand-green py-3.5 px-4 rounded font-sans text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center space-x-1.5 shadow-gold-glow cursor-pointer"
                  >
                    <Sparkles className="w-4.5 h-4.5 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </>
              ) : (
                /* OUT OF STOCK NOTIFY ME BUTTON */
                <button
                  onClick={() => setIsNotifyOpen(true)}
                  className="flex-1 bg-[#143021] hover:bg-[#0E2317] text-[#C5972E] py-3.5 px-6 rounded-xl font-sans text-xs font-extrabold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md border border-[#C5972E]/40"
                >
                  <Bell className="w-4.5 h-4.5 text-[#C5972E] fill-current" />
                  <span>NOTIFY ME WHEN BACK IN STOCK</span>
                </button>
              )}

              {/* Wishlist CTA */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded border transition-all duration-300 ${
                  inWishlist
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white border-brand-gold/30 text-brand-green hover:bg-brand-cream'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>

            </div>

          </div>
        );
      })()}

        </div>

      </div>

      {/* Product Details Tabs / Accordions */}
      <div className="max-w-4xl mx-auto border-t border-brand-creamDark pt-10 space-y-4">
            
            {/* 1. Description */}
            <div className="border-b border-brand-creamDark pb-4">
              <button
                type="button"
                onClick={() => toggleAccordion('description')}
                className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
              >
                <span>Description</span>
                <span className="text-brand-gold font-bold text-base">{openAccordions.description ? '−' : '+'}</span>
              </button>
              {openAccordions.description && (
                <div className="mt-3 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans font-light text-left whitespace-pre-line">
                  {product.description || <span className="italic opacity-60">Not specified</span>}
                </div>
              )}
            </div>

            {/* 2. Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="border-b border-brand-creamDark pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('ingredients')}
                  className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
                >
                  <span>Ingredients</span>
                  <span className="text-brand-gold font-bold text-base">{openAccordions.ingredients ? '−' : '+'}</span>
                </button>
                {openAccordions.ingredients && (
                  <div className="mt-3 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans text-left">
                    <ul className="list-disc pl-5 space-y-1.5 font-light">
                      {product.ingredients.map((ing, idx) => (
                        <li key={idx}>
                          <span className="font-bold text-brand-green">{ing.split('(')[0]}</span>
                          {ing.includes('(') && <span className="text-[11px] text-brand-charcoalLight">({ing.split('(')[1]}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 3. Storage Instructions */}
            {Boolean(product.storageInstructions && product.storageInstructions.trim()) && (
              <div className="border-b border-brand-creamDark pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('storage')}
                  className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
                >
                  <span>Storage Instructions</span>
                  <span className="text-brand-gold font-bold text-base">{openAccordions.storage ? '−' : '+'}</span>
                </button>
                {openAccordions.storage && (
                  <div className="mt-3 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans font-light space-y-1 text-left whitespace-pre-line">
                    <p>{product.storageInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. Nutrition Facts */}
            {Boolean(product.nutritionFacts && product.nutritionFacts.trim()) && (
              <div className="border-b border-brand-creamDark pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('nutrition')}
                  className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
                >
                  <span>Nutrition Facts</span>
                  <span className="text-brand-gold font-bold text-base">{openAccordions.nutrition ? '−' : '+'}</span>
                </button>
                {openAccordions.nutrition && (
                  <div className="mt-3 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans font-light text-left">
                    <div className="whitespace-pre-line font-medium bg-brand-cream/30 p-3 rounded border border-brand-gold/15">
                      {product.nutritionFacts}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Shipping & Delivery */}
            {Boolean(product.shippingInfo && product.shippingInfo.trim()) && (
              <div className="border-b border-brand-creamDark pb-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
                >
                  <span>Shipping & Delivery</span>
                  <span className="text-brand-gold font-bold text-base">{openAccordions.shipping ? '−' : '+'}</span>
                </button>
                {openAccordions.shipping && (
                  <div className="mt-3 text-xs md:text-sm text-brand-charcoalLight leading-relaxed font-sans font-light space-y-1 text-left whitespace-pre-line">
                    <p>{product.shippingInfo}</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Reviews */}
            <div ref={reviewsRef} className="border-b border-[#E1D7C6] pb-2">
              <button
                type="button"
                onClick={() => toggleAccordion('reviews')}
                className="w-full flex justify-between items-center text-sm font-bold text-brand-green font-serif uppercase tracking-wider cursor-pointer"
              >
                <span>Reviews ({reviewCount})</span>
                <span className="text-brand-gold font-bold text-base">{openAccordions.reviews ? '−' : '+'}</span>
              </button>
              {openAccordions.reviews && (
                <div className="mt-3 space-y-6">
                  
                  {/* Reviews List */}
                  <div className="space-y-4">
                    {isReviewsLoading ? (
                      <p className="text-xs text-brand-charcoalLight/65">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-xs text-brand-charcoalLight/65 italic">No reviews yet for this delicacy. Be the first to write one!</p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev._id || rev.id} className="space-y-1.5 border-b border-brand-creamDark/40 pb-3 text-left">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-2">
                              <img 
                                src={rev.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                                alt={rev.userName} 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-bold text-brand-green">{rev.userName}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-[10px] text-brand-charcoalLight/65">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                              
                              {/* Show delete button if owner of review or admin */}
                              {user.isLoggedIn && (user._id === rev.userId || user.id === rev.userId || user.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteReview(rev._id || rev.id)}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <div className="flex items-center text-brand-gold">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'opacity-30'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-brand-charcoalLight italic font-sans">"{rev.comment}"</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Write a Review Section */}
                  <div className="border-t border-brand-creamDark/60 pt-4 text-left space-y-4">
                    <h3 className="text-xs font-bold text-brand-green font-serif uppercase tracking-wider">
                      Write a Review
                    </h3>
                    
                    {user.isLoggedIn ? (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        {/* Rating Stars Selector */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-brand-charcoalLight font-medium">Your Rating:</span>
                          <div className="flex items-center text-brand-gold">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewRating(star)}
                                className="cursor-pointer hover:scale-110 transition-transform p-0.5"
                              >
                                <Star 
                                  className={`w-4.5 h-4.5 ${star <= newRating ? 'fill-current' : 'opacity-30'}`} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment Area */}
                        <div className="space-y-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            placeholder="Share your thoughts about this traditional delicacy..."
                            className="w-full min-h-[80px] p-2.5 bg-white border border-brand-gold/20 focus:border-brand-gold focus:outline-none rounded text-xs text-brand-charcoal"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="bg-brand-green hover:bg-brand-greenDark text-brand-cream py-2 px-4 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-brand-cream/35 border border-brand-gold/15 p-3 rounded text-center space-y-2">
                        <p className="text-[11px] text-brand-charcoalLight font-medium">Please login to write a review for this delicacy.</p>
                        <Link 
                          to="/login"
                          className="inline-block bg-brand-green hover:bg-brand-greenDark text-brand-cream text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded transition-all duration-300"
                        >
                          Login
                        </Link>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>

          </div>

      {/* "You May Also Like" Related Products section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs text-brand-gold font-bold tracking-[0.25em] uppercase block">
            RECOMMENDATIONS
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-green serif-header">
            You May Also Like
          </h2>
          <div className="w-16 h-[2px] bg-brand-gold mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {displayRelated.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Quick View Modal Overlay */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* Notify Me Modal */}
      <NotifyMeModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        product={product}
      />

    </div>
  );
}
