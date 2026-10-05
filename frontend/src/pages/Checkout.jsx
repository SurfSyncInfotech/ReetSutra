import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useReetSutra } from '../context/ReetSutraContext';
import { Plus, Check, ShieldCheck, MapPin, Gift, Trash2 } from 'lucide-react';

export default function Checkout() {
  const { cart, addresses, token, user, products, settings, addAddress, showToast, placeOrder, initializeRazorpayOrder, verifyRazorpayPayment, handleFrontendImageError } = useReetSutra();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  // Get total parameters from Cart navigation state, or compute if refreshed
  const state = location.state || {};
  const buyNowItem = state.buyNowItem || null;
  const [selectedSample, setSelectedSample] = useState(state.selectedSample || null);

  const sampleProductsList = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter(p => {
      const catName = p.categoryName || (typeof p.category === 'string' ? p.category : p.category?.name) || '';
      const norm = catName.toLowerCase().trim();
      return norm === 'sample' || norm === 'sample products' || norm === 'samples' || norm.includes('sample');
    });
  }, [products]);

  const isSampleOfferDisabled = settings?.freeSampleOffer === false || settings?.freeSampleOffer === 'false' || settings?.freeSampleOffer === 0 || settings?.freeSampleOffer === 'disabled';

  const hasMainProductInCheckout = buyNowItem
    ? (() => {
        const p = buyNowItem.product || {};
        const catName = p.categoryName || (typeof p.category === 'string' ? p.category : p.category?.name) || '';
        const norm = catName.toLowerCase().trim();
        const isSample = norm === 'sample' || norm === 'sample products' || norm === 'samples' || norm.includes('sample') || p.isSample;
        return !isSample;
      })()
    : (cart || []).some(item => {
        const p = item.product || {};
        const catName = p.categoryName || (typeof p.category === 'string' ? p.category : p.category?.name) || '';
        const norm = catName.toLowerCase().trim();
        const isSample = norm === 'sample' || norm === 'sample products' || norm === 'samples' || norm.includes('sample') || p.isSample;
        return !isSample;
      });

  const isSampleOfferEligible = !isSampleOfferDisabled && hasMainProductInCheckout;

  useEffect(() => {
    if (!isSampleOfferEligible) {
      setSelectedSample(null);
    }
  }, [isSampleOfferEligible]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddr, setBillingAddr] = useState({
    name: '', phone: '', line: '', city: '', state: '', zip: ''
  });
  const [newAddr, setNewAddr] = useState({
    name: '',
    type: 'Home',
    street: '',
    city: '',
    state: 'Bihar',
    zip: '',
    phone: ''
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const checkoutItems = buyNowItem ? [buyNowItem] : (state.checkoutItems || cart || []);
  const checkoutCount = buyNowItem ? buyNowItem.quantity : checkoutItems.reduce((acc, item) => acc + item.quantity, 0);

  // Authentication Guard: Redirect logged-out users once to /login form
  useEffect(() => {
    const isLoggedIn = Boolean(token || (user && user.isLoggedIn));
    if (!isLoggedIn && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      showToast("Please login or create an account to proceed with checkout.", "error");
      navigate('/login', { state: { from: '/checkout', buyNowItem } });
    }
  }, [token, user, navigate, showToast, buyNowItem]);

  // Redirect if checkout items are empty
  useEffect(() => {
    if (!buyNowItem && checkoutCount === 0) {
      navigate('/cart');
    }
  }, [checkoutCount, navigate, buyNowItem]);

  // Pre-select the default saved address once addresses load, without
  // clobbering a selection the user already made manually.
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    if (selectedAddressId && addresses.some(a => a.id === selectedAddressId)) return;
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    if (defaultAddr) setSelectedAddressId(defaultAddr.id);
  }, [addresses]);

  // Calculations
  const totalOriginalAmount = state.totalOriginalAmount || checkoutItems.reduce((acc, item) => {
    const origPrice = item.product.originalPrice || item.product.compareAtPrice || (item.product.discount > 0 ? Math.round(item.product.price / (1 - item.product.discount / 100)) : item.product.price);
    return acc + (origPrice * item.quantity);
  }, 0);

  const subtotal = state.subtotal || checkoutItems.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity);
  }, 0);

  const totalOfferSavings = Math.max(0, totalOriginalAmount - subtotal);
  const discount = state.discount || 0;
  const deliveryCharge = subtotal > 799 || subtotal === 0 ? 0 : 70;
  const total = subtotal - discount + deliveryCharge;

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (newAddr.name && newAddr.street && newAddr.city && newAddr.zip && newAddr.phone) {
      const added = await addAddress(newAddr);
      if (added) setSelectedAddressId(added.id);
      setShowAddAddressForm(false);
      setNewAddr({
        name: '',
        type: 'Home',
        street: '',
        city: '',
        state: 'Bihar',
        zip: '',
        phone: ''
      });
    }
  };

  const handleProceedToPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
      showToast('Please select or add a delivery address.', 'error');
      setIsProcessing(false);
      return;
    }

    const couponCode = state.couponCode || "";
    showToast('Placing your order... Please wait.', 'info');

    if (paymentMethod === 'COD') {
      try {
        const orderId = await placeOrder({
          subtotal,
          discount,
          couponCode,
          deliveryCharge,
          total,
          address: selectedAddress,
          billingAddress: billingSameAsShipping ? null : billingAddr,
          paymentMethod: 'COD',
          buyNowItem,
          checkoutItems,
          selectedSample
        });

        if (orderId) {
          showToast('Order placed successfully!', 'success');
          navigate('/order-success', { state: { orderId } });
        }
      } catch (err) {
        console.error("COD order failed:", err);
        showToast('Failed to place order. Please try again.', 'error');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Razorpay Online Flow
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast('Failed to load Razorpay SDK. Please check your internet connection.');
          setIsProcessing(false);
          return;
        }

        const razorpayOrderData = await initializeRazorpayOrder({
          subtotal,
          discount,
          couponCode,
          deliveryCharge,
          total,
          address: selectedAddress,
          billingAddress: billingSameAsShipping ? null : billingAddr,
          paymentMethod: 'Razorpay',
          buyNowItem,
          checkoutItems,
          selectedSample
        });

        if (!razorpayOrderData) {
          setIsProcessing(false);
          return;
        }

        const { key_id, amount, currency, razorpayOrderId, orderId, customer } = razorpayOrderData;

        const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          name: 'ReetSutra',
          description: 'Traditional Bihar Delicacies Order Payment',
          image: '/logo192.png',
          order_id: razorpayOrderId,
          handler: async (response) => {
            setIsProcessing(true);
            try {
              const verified = await verifyRazorpayPayment({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                buyNowItem
              });

              if (verified) {
                navigate('/order-success', { state: { orderId } });
              }
            } catch (error) {
              console.error("Payment verification error:", error);
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone || '9999999999'
          },
          notes: {
            address: `${selectedAddress.street}, ${selectedAddress.city}`
          },
          theme: {
            color: '#0D1D14'
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              showToast('Payment cancelled by user.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error("Razorpay initiation error:", err);
        showToast('Something went wrong. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-4xl font-extrabold text-brand-green font-serif">
          Secure Checkout
        </h1>
        <p className="text-xs text-brand-charcoalLight uppercase tracking-wider font-semibold">
          Step 1 of 2: Shipping & Payment Preferences
        </p>
      </div>

      {/* Free Sample Product Selection Widget (Positioned right below Secure Checkout Header) */}
      {isSampleOfferEligible && sampleProductsList.length > 0 && (
        <div className="bg-brand-green text-brand-cream p-5 sm:p-6 rounded-lg space-y-4 border border-brand-gold/30 shadow-premium">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-cream/15 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-brand-gold" />
              <h3 className="font-serif text-base md:text-lg font-bold text-brand-cream">
                Choose 1 Free Sample Product (₹0)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {selectedSample && (
                <button
                  type="button"
                  onClick={() => setSelectedSample(null)}
                  className="px-3 py-1 bg-red-800/80 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase font-sans flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Trash2 size={12} /> Remove Sample
                </button>
              )}
              <span className="bg-brand-gold text-brand-green text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Free Add-on
              </span>
            </div>
          </div>

          <p className="text-xs text-brand-cream/80 font-sans">
            Select 1 free sample product to be added to your order for <strong className="text-brand-gold">FREE (₹0)</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white/20 border-brand-gold ring-2 ring-brand-gold shadow-md'
                      : 'bg-white/5 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={handleFrontendImageError ? sample.image : sample.image}
                      alt={sample.name}
                      onError={handleFrontendImageError}
                      className="w-11 h-11 object-cover rounded border border-white/20 shrink-0 bg-white/10"
                    />
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="font-serif text-xs font-bold text-brand-cream truncate" title={sample.name}>
                        {sample.name}
                      </div>
                      <div className="text-[10px] text-brand-gold font-mono">SKU: {sample.sku}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10 text-xs">
                    <span className="text-brand-cream/50 line-through font-mono text-[10px]">₹{sample.mrp}</span>
                    <div>
                      {isSelected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(null);
                          }}
                          className="text-amber-300 hover:text-red-200 font-bold text-[9px] uppercase font-mono flex items-center gap-1 bg-red-900/70 hover:bg-red-800 px-2 py-1 rounded border border-amber-300/60 hover:border-red-400 transition-colors cursor-pointer"
                          title="Click to unselect this free sample"
                        >
                          <Check className="w-3 h-3 text-amber-300" /> SELECTED (REMOVE ✖)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(sample);
                          }}
                          className="text-brand-gold hover:text-brand-green font-bold text-[10px] uppercase font-sans tracking-wider bg-white/10 hover:bg-brand-gold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          + SELECT FREE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns: Address & Payment Methods */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Address Selection */}
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
            
            <div className="flex justify-between items-center border-b border-brand-creamDark pb-3">
              <h2 className="text-lg font-bold text-brand-green font-serif flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-brand-gold" />
                <span>1. Select Shipping Address</span>
              </h2>
              {!showAddAddressForm && (
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="text-xs font-bold text-brand-gold hover:text-brand-green uppercase tracking-wider flex items-center space-x-1"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Add New</span>
                </button>
              )}
            </div>

            {/* List of addresses */}
            {!showAddAddressForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 relative ${
                      selectedAddressId === addr.id
                        ? 'border-brand-gold bg-brand-cream/50 shadow-premium'
                        : 'border-brand-gold/20 bg-white hover:border-brand-gold/60'
                    }`}
                  >
                    {selectedAddressId === addr.id && (
                      <span className="absolute top-3 right-3 bg-brand-gold text-brand-green p-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-brand-gold uppercase bg-brand-cream border border-brand-gold/20 px-2 py-0.5 rounded-sm">
                      {addr.type}
                    </span>
                    <p className="font-bold text-brand-green font-serif mt-2">{addr.name}</p>
                    <p className="text-xs text-brand-charcoalLight mt-1 leading-relaxed">{addr.street}</p>
                    <p className="text-xs text-brand-charcoalLight">{addr.city}, {addr.state} - {addr.zip}</p>
                    <p className="text-xs text-brand-charcoalLight/70 mt-2 font-medium">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form inline */}
            {showAddAddressForm && (
              <form onSubmit={handleAddAddressSubmit} className="space-y-4 bg-white border border-brand-gold/15 p-5 rounded-lg">
                <div className="flex justify-between items-center border-b border-brand-creamDark pb-2">
                  <h3 className="text-sm font-bold text-brand-green font-serif">Add New Delivery Location</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className="text-xs text-brand-charcoalLight hover:text-red-500 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nikhil Kumar"
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Address Type</label>
                    <select
                      value={newAddr.type}
                      onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Street Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Flat No, Apartment, Boring Road"
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">City</label>
                      <input
                        type="text"
                        required
                        placeholder="Patna"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">State</label>
                      <input
                        type="text"
                        required
                        placeholder="Bihar"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">PIN Code</label>
                      <input
                        type="text"
                        required
                        placeholder="800001"
                        value={newAddr.zip}
                        onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className="px-4 py-2 border border-brand-green/30 text-brand-green rounded text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand-green hover:bg-brand-greenDark text-brand-cream rounded text-xs uppercase tracking-wider font-bold"
                  >
                    Save Address
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* 1.5 Billing Address */}
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
            <div className="flex justify-between items-center border-b border-brand-creamDark pb-3">
              <h2 className="text-lg font-bold text-brand-green font-serif flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-brand-gold" />
                <span>Billing Address</span>
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="billingSame" 
                checked={billingSameAsShipping} 
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="w-4 h-4 text-brand-green bg-brand-cream border-brand-gold focus:ring-brand-green rounded cursor-pointer"
              />
              <label htmlFor="billingSame" className="text-sm font-bold text-brand-green font-serif cursor-pointer">Billing address same as shipping address</label>
            </div>

            {!billingSameAsShipping && (
              <div className="space-y-4 bg-white border border-brand-gold/15 p-5 rounded-lg mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nikhil Kumar"
                      value={billingAddr.name}
                      onChange={(e) => setBillingAddr({ ...billingAddr, name: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={billingAddr.phone}
                      onChange={(e) => setBillingAddr({ ...billingAddr, phone: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">Address Line</label>
                    <input
                      type="text"
                      required
                      placeholder="Flat No, Apartment, Street"
                      value={billingAddr.line}
                      onChange={(e) => setBillingAddr({ ...billingAddr, line: e.target.value })}
                      className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">City</label>
                      <input
                        type="text"
                        required
                        placeholder="Patna"
                        value={billingAddr.city}
                        onChange={(e) => setBillingAddr({ ...billingAddr, city: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">State</label>
                      <input
                        type="text"
                        required
                        placeholder="Bihar"
                        value={billingAddr.state}
                        onChange={(e) => setBillingAddr({ ...billingAddr, state: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">PIN Code</label>
                      <input
                        type="text"
                        required
                        placeholder="800001"
                        value={billingAddr.zip}
                        onChange={(e) => setBillingAddr({ ...billingAddr, zip: e.target.value })}
                        className="w-full bg-brand-cream/30 border border-brand-gold/30 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Payment Method Selector */}
          <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
            
            <div className="border-b border-brand-creamDark pb-3">
              <h2 className="text-lg font-bold text-brand-green font-serif flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-gold" />
                <span>2. Select Simulated Payment Option</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'Razorpay', name: 'Pay Online', desc: 'UPI, Cards, NetBanking (Powered by Razorpay)' },
                { id: 'COD', name: 'Cash on Delivery', desc: 'Pay with cash upon delivery' }
              ].map(method => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 relative text-center space-y-1 ${
                    paymentMethod === method.id
                      ? 'border-brand-gold bg-brand-cream/50 shadow-premium'
                      : 'border-brand-gold/20 bg-white hover:border-brand-gold/60'
                  }`}
                >
                  {paymentMethod === method.id && (
                    <span className="absolute top-2 right-2 bg-brand-gold text-brand-green p-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <h3 className="font-extrabold text-sm text-brand-green font-serif">{method.name}</h3>
                  <p className="text-[10px] text-brand-charcoalLight/70 font-sans leading-normal">{method.desc}</p>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Checkout Totals Review */}
        <div className="bg-brand-ivory border border-brand-gold/10 rounded-lg p-6 shadow-premium space-y-6">
          
          <h2 className="text-sm font-bold text-brand-green tracking-wider uppercase font-serif border-b border-brand-creamDark pb-3">
            Review Items ({checkoutCount})
          </h2>

          {/* Miniature List */}
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {checkoutItems.map((item) => {
              const unitPrice = item.product.price;
              const originalUnitPrice = item.product.originalPrice || item.product.compareAtPrice || (item.product.discount > 0 ? Math.round(item.product.price / (1 - item.product.discount / 100)) : item.product.price);
              const discountPct = item.product.discount || 0;

              return (
                <div key={item.product.id || item.product._id} className="flex justify-between items-center text-xs font-sans border-b border-brand-gold/10 pb-2.5">
                  <div className="space-y-1">
                    <p className="font-bold text-brand-green line-clamp-1">{item.product.name}</p>
                    
                    {/* Offer Tag Badge */}
                    {discountPct > 0 && (
                      <span className="inline-block text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        🔥 Offer: {discountPct}% OFF Applied
                      </span>
                    )}

                    <div className="flex items-baseline space-x-1.5 text-[11px]">
                      <span className="font-bold text-brand-green">{item.quantity} x ₹{unitPrice}</span>
                      {originalUnitPrice > unitPrice && (
                        <span className="text-brand-charcoalLight line-through text-[10px]">₹{originalUnitPrice}</span>
                      )}
                      {discountPct > 0 && (
                        <span className="text-amber-700 font-bold text-[10px]">({discountPct}% OFF)</span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-brand-green shrink-0 text-sm">₹{unitPrice * item.quantity}</span>
                </div>
              );
            })}
            {selectedSample && (
              <div className="p-2 bg-brand-green/5 border border-brand-gold/30 rounded flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block">Free Sample Add-on</span>
                  <span className="font-bold text-brand-green font-serif">{selectedSample.name}</span>
                  <span className="text-[10px] text-brand-charcoalLight/70 font-mono block">SKU: {selectedSample.sku}</span>
                </div>
                <div className="text-right">
                  <span className="text-brand-charcoalLight/50 line-through text-[10px] block">₹{selectedSample.mrp}</span>
                  <span className="font-bold text-brand-gold text-xs font-serif">FREE</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing calculations */}
          <div className="border-t border-brand-creamDark pt-4 space-y-3.5 text-xs md:text-sm text-brand-charcoalLight font-sans">
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
              <span>Items Subtotal</span>
              <span className="font-bold text-brand-green">₹{subtotal}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Promo Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="font-bold text-brand-green">
                {deliveryCharge === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryCharge}`}
              </span>
            </div>
            <div className="border-t border-brand-creamDark pt-3.5 flex justify-between text-base md:text-lg font-extrabold text-brand-green">
              <span>Total Payable</span>
              <span className="text-brand-gold font-black">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={isProcessing}
            className={`w-full py-4 rounded font-sans text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 shadow-gold-glow ${
              isProcessing
                ? 'bg-brand-green/50 cursor-not-allowed text-brand-cream/70'
                : 'bg-brand-green hover:bg-brand-greenDark text-brand-cream cursor-pointer'
            }`}
          >
            <span>{isProcessing ? 'Placing Order... Please Wait' : 'Proceed to Payment'}</span>
          </button>

          <div className="text-center">
            {buyNowItem ? (
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="text-[10px] font-bold text-brand-gold hover:text-brand-green uppercase tracking-wider underline cursor-pointer bg-transparent border-0"
              >
                Return to Product
              </button>
            ) : (
              <Link 
                to="/cart"
                className="text-[10px] font-bold text-brand-gold hover:text-brand-green uppercase tracking-wider underline"
              >
                Modify Cart Items
              </Link>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
