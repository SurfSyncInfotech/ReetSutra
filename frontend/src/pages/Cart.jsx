import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReetSutra } from '../context/ReetSutraContext';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, Gift, Check } from 'lucide-react';

import { API_BASE_URL, handleFrontendImageError } from '../config';

export default function Cart() {
  const { cart, user, updateCartQuantity, removeFromCart, rawProducts, products, settings } = useReetSutra();
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const navigate = useNavigate();

  // Dynamically filter products created under "Sample" category in backend database
  const sampleProductsList = React.useMemo(() => {
    const catalog = rawProducts?.length ? rawProducts : (products || []);
    return catalog.filter(p => {
      const catName = typeof p.category === 'object' ? (p.category?.name || '') : (p.category || '');
      const norm = catName.toString().trim().toLowerCase();
      return norm === 'sample' || norm === 'sample products' || norm === 'samples' || norm.includes('sample');
    }).map(p => ({
      id: p.id || p._id,
      sku: p.sku || `SMPL-${(p.name || 'PROD').slice(0, 4).toUpperCase()}`,
      name: p.name,
      mrp: p.compareAtPrice || p.price || 70,
      price: 0,
      image: p.image || p.images?.[0] || '',
      description: p.description || ''
    }));
  }, [rawProducts, products]);

  const [selectedSample, setSelectedSample] = useState(null);

  // Track selected item IDs for checkout. Default: all cart items selected.
  const [selectedCartItemIds, setSelectedCartItemIds] = useState(() => {
    return new Set((cart || []).map(item => String(item.product?.id || item.product?._id)));
  });

  // Keep selectedCartItemIds in sync when new items arrive in cart
  React.useEffect(() => {
    setSelectedCartItemIds(prev => {
      const next = new Set(prev);
      (cart || []).forEach(item => {
        const key = String(item.product?.id || item.product?._id);
        if (key && !prev.has(key)) {
          next.add(key);
        }
      });
      return next;
    });
  }, [cart]);

  const toggleItemSelection = (productId) => {
    const key = String(productId);
    setSelectedCartItemIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCartItemIds.size === cart.length) {
      setSelectedCartItemIds(new Set());
    } else {
      setSelectedCartItemIds(new Set((cart || []).map(item => String(item.product?.id || item.product?._id))));
    }
  };

  const checkedCartItems = cart.filter(item => {
    const key = String(item.product?.id || item.product?._id);
    return selectedCartItemIds.has(key);
  });

  const isSampleOfferDisabled = settings?.freeSampleOffer === false || settings?.freeSampleOffer === 'false' || settings?.freeSampleOffer === 0 || settings?.freeSampleOffer === 'disabled';

  const hasMainProductInCart = checkedCartItems.some(item => {
    const p = item.product || {};
    const catName = p.categoryName || (typeof p.category === 'string' ? p.category : p.category?.name) || '';
    const normCat = catName.toLowerCase().trim();
    const isSample = normCat === 'sample' || normCat === 'sample products' || normCat === 'samples' || normCat.includes('sample') || p.isSample;
    return !isSample;
  });

  const isSampleOfferEligible = !isSampleOfferDisabled && hasMainProductInCart;

  React.useEffect(() => {
    if (!isSampleOfferEligible) {
      setSelectedSample(null);
    }
  }, [isSampleOfferEligible]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const checkedCartCount = checkedCartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Math Calculations computed strictly on checked items!
  const totalOriginalAmount = checkedCartItems.reduce((acc, item) => {
    const origPrice = item.product.originalPrice || item.product.compareAtPrice || (item.product.discount > 0 ? Math.round(item.product.price / (1 - item.product.discount / 100)) : item.product.price);
    return acc + (origPrice * item.quantity);
  }, 0);

  const subtotal = checkedCartItems.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity);
  }, 0);

  const totalOfferSavings = Math.max(0, totalOriginalAmount - subtotal);
  const deliveryCharge = subtotal > 799 || subtotal === 0 ? 0 : 70;
  
  const discountAmount = appliedDiscountAmount;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Please enter a valid coupon code.');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      const activeToken = localStorage.getItem("rs_token");
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          cartSubtotal: subtotal,
          cartItems: cart,
          userId: user?.id || user?._id || "",
          email: user?.email || ""
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAppliedDiscountAmount(data.data.discountAmount || 0);
        setAppliedCouponData(data.data.coupon || null);
        setCouponSuccess(data.message || '✓ Coupon applied successfully!');
      } else {
        setAppliedDiscountAmount(0);
        setAppliedCouponData(null);
        setCouponError(data.message || 'Invalid coupon code.');
      }
    } catch (err) {
      console.error("Error validating coupon code:", err);
      // Fallback for offline/mock demo codes if backend API server is down
      const code = couponCode.trim().toUpperCase();
      if (code === 'BIHAR15') {
        const amt = Math.round(subtotal * 0.15);
        setAppliedDiscountAmount(amt);
        setCouponSuccess('✓ Coupon applied: 15% off on your heritage order!');
      } else if (code === 'FESTIVE10') {
        const amt = Math.round(subtotal * 0.10);
        setAppliedDiscountAmount(amt);
        setCouponSuccess('✓ Coupon applied: 10% off on all sweets!');
      } else {
        setCouponError(err?.message || 'Invalid or expired coupon code.');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (checkedCartItems.length === 0) {
      return;
    }
    navigate('/checkout', {
      state: {
        subtotal,
        discount: discountAmount,
        couponCode: appliedCouponData?.code || couponCode,
        deliveryCharge,
        total: finalTotal,
        selectedSample,
        checkoutItems: checkedCartItems
      }
    });
  };

  if (cartCount === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-brand-cream border border-brand-gold/20 rounded-full flex items-center justify-center mx-auto text-brand-gold">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-green font-serif">Your Cart is Empty</h2>
        <p className="text-sm text-brand-charcoalLight max-w-md mx-auto font-sans">
          Looks like you haven't added any of our authentic traditional Bihari delicacies to your cart yet.
        </p>
        <Link 
          to="/shop" 
          className="inline-flex items-center space-x-2 bg-brand-green hover:bg-brand-greenDark text-brand-cream px-8 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <span>Explore Heritage Treats</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title */}
      <div className="border-b border-brand-creamDark pb-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-green font-serif">
          Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
        </h1>
        <p className="text-xs md:text-sm text-brand-charcoalLight mt-1 font-sans">
          Review your selection of artisanal Bihari delicacies before proceeding to checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Select All Bar */}
          <div className="flex items-center justify-between bg-white border border-brand-gold/20 rounded-xl px-4 py-3 shadow-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedCartItemIds.size === cart.length && cart.length > 0}
                onChange={toggleSelectAll}
                className="w-4.5 h-4.5 rounded border-brand-gold/40 text-brand-green focus:ring-brand-gold cursor-pointer accent-[#143021]"
              />
              <span className="text-xs font-bold text-brand-green font-sans">
                Select All Items for Checkout ({checkedCartItems.length}/{cart.length} Selected)
              </span>
            </label>
            {selectedCartItemIds.size < cart.length && (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-sans">
                {cart.length - selectedCartItemIds.size} Item(s) saved in cart (Not Selected)
              </span>
            )}
          </div>

          {cart.map((item) => {
            const unitPrice = item.product.price;
            const originalUnitPrice = item.product.originalPrice || item.product.compareAtPrice || (item.product.discount > 0 ? Math.round(item.product.price / (1 - item.product.discount / 100)) : item.product.price);
            const discountPct = item.product.discount || 0;
            const hasFloatingOffer = item.product.hasFloatingOffer || false;
            const itemTotal = unitPrice * item.quantity;
            const itemIdKey = String(item.product.id || item.product._id);
            const isSelectedForCheckout = selectedCartItemIds.has(itemIdKey);

            return (
              <div 
                key={item.product.id} 
                className={`bg-white border rounded-xl p-4 sm:p-6 shadow-sm transition-all flex flex-col space-y-3.5 ${
                  isSelectedForCheckout ? 'border-brand-gold/30' : 'border-gray-200 opacity-80 bg-gray-50/50'
                }`}
              >
                {/* Item Selection Header Checkbox */}
                <div className="flex items-center justify-between border-b border-brand-gold/10 pb-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelectedForCheckout}
                      onChange={() => toggleItemSelection(item.product.id || item.product._id)}
                      className="w-4.5 h-4.5 rounded border-brand-gold/40 text-brand-green focus:ring-brand-gold cursor-pointer accent-[#143021]"
                    />
                    <span className={`text-xs font-bold font-sans ${isSelectedForCheckout ? 'text-brand-green' : 'text-brand-charcoalLight/60'}`}>
                      {isSelectedForCheckout ? '☑ Selected for Checkout' : '☐ Saved in Cart (Not Selected)'}
                    </span>
                  </label>
                  {!isSelectedForCheckout && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded font-sans">
                      Will not be ordered
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  
                  {/* Item Image */}
                  <Link to={`/product/${item.product.id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded overflow-hidden border border-brand-gold/20 shrink-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      onError={handleFrontendImageError}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold font-sans">
                      {item.product.category}
                    </span>
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="text-base font-bold text-brand-green font-serif hover:text-brand-gold transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-brand-charcoalLight font-sans">
                      Net Weight: <span className="font-semibold text-brand-green">{item.product.weight}</span>
                    </p>
                    
                    {/* Offer Tag Badge */}
                    {discountPct > 0 && (
                      <div className="pt-0.5 flex items-center justify-center sm:justify-start">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                          hasFloatingOffer 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {hasFloatingOffer ? `🔥 Offer: ${discountPct}% OFF Applied` : `🏷️ ${discountPct}% OFF Discount Applied`}
                        </span>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="flex items-baseline justify-center sm:justify-start space-x-2 pt-1 font-sans">
                      <span className="text-base font-extrabold text-brand-green">₹{unitPrice}</span>
                      {originalUnitPrice > unitPrice && (
                        <span className="text-xs text-brand-charcoalLight line-through">
                          ₹{originalUnitPrice}
                        </span>
                      )}
                      {discountPct > 0 && (
                        <span className="text-[11px] font-bold text-amber-700">
                          ({discountPct}% OFF)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls & Total */}
                  <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-4">
                    
                    {/* Quantity Buttons */}
                    <div className="flex items-center border border-brand-gold/30 rounded overflow-hidden bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.product.id || item.product._id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-brand-green hover:bg-brand-cream text-xs font-bold"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-brand-green font-sans">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id || item.product._id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-brand-green hover:bg-brand-cream text-xs font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Item Total & Remove */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-brand-green font-sans">
                        ₹{itemTotal}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id || item.product._id)}
                        className="text-brand-charcoalLight hover:text-red-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

                {/* Option 1: Direct Linked Free Sample Sub-Card attached directly to this Main Product */}
                {(() => {
                  const catName = item.product?.categoryName || (typeof item.product?.category === 'string' ? item.product.category : item.product?.category?.name) || '';
                  const normCat = catName.toLowerCase().trim();
                  const isMainProduct = !(normCat === 'sample' || normCat === 'sample products' || normCat === 'samples' || normCat.includes('sample') || item.product?.isSample);

                  if (!isMainProduct || !isSampleOfferEligible || sampleProductsList.length === 0) return null;

                  return (
                    <div className="bg-brand-green/5 border-2 border-dashed border-brand-gold/40 rounded-lg p-3.5 space-y-3 mt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-gold/20 pb-2">
                        <div className="flex items-center space-x-2">
                          <Gift className="w-4.5 h-4.5 text-brand-gold shrink-0" />
                          <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-green">
                            🎁 Free Sample Gift linked with {item.product.name}
                          </h4>
                        </div>
                        {selectedSample && (
                          <button
                            type="button"
                            onClick={() => setSelectedSample(null)}
                            className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove Free Sample
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-brand-charcoalLight/90 font-sans">
                        Choose 1 free sample product to be added with <strong className="text-brand-green">{item.product.name}</strong> for <strong className="text-brand-green font-serif font-bold">FREE (₹0)</strong>:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {sampleProductsList.map((sample) => {
                          const isSelected = selectedSample?.id === sample.id || selectedSample?.sku === sample.sku;
                          return (
                            <div
                              key={sample.id || sample.sku}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSample(null);
                                } else {
                                  setSelectedSample(sample);
                                }
                              }}
                              className={`p-2.5 rounded-md border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-brand-green text-brand-cream border-brand-gold ring-2 ring-brand-gold shadow-md'
                                  : 'bg-white border-brand-gold/20 hover:border-brand-gold/50 text-brand-charcoal'
                              }`}
                            >
                              <div className="flex items-center space-x-2 overflow-hidden">
                                <img
                                  src={handleFrontendImageError ? sample.image : sample.image}
                                  alt={sample.name}
                                  onError={handleFrontendImageError}
                                  className="w-9 h-9 object-cover rounded border border-brand-gold/20 shrink-0 bg-white"
                                />
                                <div className="space-y-0.5 overflow-hidden">
                                  <div className={`font-serif text-xs font-bold truncate ${isSelected ? 'text-brand-cream' : 'text-brand-green'}`} title={sample.name}>
                                    {sample.name}
                                  </div>
                                  <div className={`text-[9px] font-mono ${isSelected ? 'text-brand-gold' : 'text-brand-charcoalLight/70'}`}>
                                    SKU: {sample.sku}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <span className="text-amber-300 font-bold text-[9px] uppercase font-mono bg-black/20 px-2 py-0.5 rounded border border-amber-300">
                                    ✔ FREE GIFT
                                  </span>
                                ) : (
                                  <span className="text-brand-gold font-bold text-[10px] uppercase font-sans hover:underline">
                                    + Select (₹0)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })}

          <div className="flex justify-between items-center pt-2">
            <Link 
              to="/shop" 
              className="text-xs font-bold text-brand-green hover:text-brand-gold flex items-center space-x-1 transition-colors uppercase tracking-widest font-sans"
            >
              <span>← Continue Shopping</span>
            </Link>
          </div>

        </div>

        {/* Right Side: Order Summary Card */}
        <div className="space-y-6">
          
          {/* Coupon Code Input */}
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-4">
            <h3 className="font-bold text-xs text-brand-green tracking-wider uppercase flex items-center space-x-2 font-serif border-b border-brand-creamDark pb-3">
              <Tag className="w-4 h-4 text-brand-gold" />
              <span>Apply Promo Coupon</span>
            </h3>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 bg-white border border-brand-gold/30 rounded px-3 py-2 text-xs font-sans text-brand-green uppercase focus:outline-none focus:border-brand-gold"
              />
              <button 
                type="submit"
                disabled={isValidatingCoupon}
                className="bg-brand-green hover:bg-brand-greenDark text-brand-cream py-2 px-4 rounded text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isValidatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </form>

            {couponError && <p className="text-[11px] text-red-500 font-bold font-sans">{couponError}</p>}
            {couponSuccess && <p className="text-[11px] text-green-600 font-bold font-sans">{couponSuccess}</p>}
          </div>

          {/* Checkout Totals Summary */}
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
            <h3 className="font-bold text-sm text-brand-green tracking-wider uppercase font-serif border-b border-brand-creamDark pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs md:text-sm text-brand-charcoalLight font-sans">
              
              <div className="flex justify-between">
                <span>Item MRP Total</span>
                <span className="font-bold text-brand-charcoal">₹{totalOriginalAmount > subtotal ? totalOriginalAmount : subtotal}</span>
              </div>

              {totalOfferSavings > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                  <span>🔥 Campaign Offer Savings</span>
                  <span>-₹{totalOfferSavings}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Subtotal (After Offers)</span>
                <span className="font-bold text-brand-green">₹{subtotal}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold bg-green-50 px-2.5 py-1.5 rounded border border-green-200">
                  <span>Coupon Discount {appliedCouponData?.code ? `(${appliedCouponData.code})` : ''}</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-brand-charcoal">
                  {deliveryCharge === 0 ? <span className="text-green-600 font-bold uppercase text-[11px]">FREE</span> : `₹${deliveryCharge}`}
                </span>
              </div>

              {selectedSample && (
                <div className="flex justify-between items-center bg-brand-green/5 p-2.5 rounded border border-brand-gold/30">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block">Free Sample Add-on</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSample(null)}
                        className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer ml-1 font-sans"
                        title="Remove Sample"
                      >
                        (Remove)
                      </button>
                    </div>
                    <span className="font-bold text-brand-green text-xs font-serif block">{selectedSample.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-brand-charcoalLight/60 line-through text-[10px] font-mono block">₹{selectedSample.mrp}</span>
                    <span className="font-bold text-brand-gold font-serif text-xs">FREE</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t border-brand-creamDark pt-3 font-serif text-base text-brand-green font-extrabold">
                <span>Total Amount</span>
                <span className="text-brand-gold text-lg">₹{finalTotal}</span>
              </div>

            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={checkedCartItems.length === 0}
              className={`w-full py-4 rounded font-sans text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center space-x-2 shadow-gold-glow cursor-pointer ${
                checkedCartItems.length > 0
                  ? 'bg-brand-green hover:bg-brand-greenDark text-brand-cream'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Proceed to Checkout ({checkedCartCount} Item{checkedCartCount !== 1 ? 's' : ''})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {deliveryCharge > 0 && (
              <p className="text-[10px] text-brand-gold font-bold text-center font-sans tracking-wide">
                💡 Add ₹{800 - subtotal} more to unlock FREE SHIPPING!
              </p>
            )}

            <div className="pt-4 border-t border-brand-creamDark flex items-center justify-center space-x-2 text-[10px] text-brand-charcoalLight/70 font-sans">
              <ShieldCheck className="w-4.5 h-4.5 text-brand-gold" />
              <span>Safe & Secure Payments Only</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
