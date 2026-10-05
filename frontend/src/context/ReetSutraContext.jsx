import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_BASE_URL, BACKEND_URL, getFrontendImageUrl } from '../config';
import { getWhatsAppUrl } from '../utils/whatsapp';

const ReetSutraContext = createContext();

export const useReetSutra = () => useContext(ReetSutraContext);

export const ReetSutraProvider = ({ children }) => {
  const [rawProducts, setRawProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [popupTimeoutId, setPopupTimeoutId] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("rs_token") || null);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('reetsutra_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('reetsutra_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('reetsutra_user');
    return saved ? JSON.parse(saved) : { isLoggedIn: false };
  });

  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  // Toast System state
  const [toast, setToast] = useState(null);
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ message, type });
    const id = setTimeout(() => {
      setToast(null);
    }, 4000);
    setToastTimeoutId(id);
  }, [toastTimeoutId]);

  const logout = useCallback(() => {
    localStorage.removeItem("rs_token");
    localStorage.removeItem("reetsutra_user");
    setToken(null);
    setUser({ isLoggedIn: false });
  }, []);

  // Fetch Products Catalog
  const getProductImageUrl = (imgPath) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const backendUrl = API_BASE_URL.replace(/\/api$/, '');
    return `${backendUrl}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=100`);
      const resJson = await response.json();

      if (response.ok && resJson.success) {
        const mapped = resJson.data.products.map(p => ({
          ...p,
          id: p._id || p.id,
          tagline: p.tagline || p.description?.slice(0, 60) || 'Delicious traditional snack item',
          baseDiscount: p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : (p.discount || 0),
          rating: (p.reviewsCount && p.reviewsCount > 0) ? (p.rating || 5.0) : 0,
          reviews: p.reviewsCount !== undefined && p.reviewsCount !== null ? p.reviewsCount : 0,
          bestseller: p.rating >= 4.8,
          category: typeof p.category === 'object' ? p.category?.name || 'Uncategorized' : (p.category || 'Uncategorized'),
          image: getProductImageUrl(p.image),
          images: Array.isArray(p.images) && p.images.length > 0
            ? p.images.map(img => getProductImageUrl(img))
            : [getProductImageUrl(p.image)],
          description: p.description,
          ingredients: p.ingredients || ['Natural ingredients', 'Prepared with love', 'Hygienically Packed'],
          benefits: p.benefits || ['High quality', 'Rich taste', 'No artificial colors'],
          weight: p.weight || '400g'
        }));
        setRawProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch products from backend:", err);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/banners?status=Active`);
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        setBanners(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch banners in context:", err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories?status=Active`);
      const resJson = await response.json();
      if (response.ok && resJson.success && Array.isArray(resJson.data)) {
        setCategoriesList(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories in context:", err);
    }
  }, []);

  // Compute products with active floating banner offers applied
  const products = React.useMemo(() => {
    const now = new Date();

    // Find active floating banners with valid date range and discount > 0
    const activeFloatingOffers = banners.filter(b => {
      if (b.status !== "Active") return false;
      const isFloating = b.bannerType === "Floating" || b.placement?.includes("Floating");
      if (!isFloating) return false;

      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;

      return (b.discountPercentage && b.discountPercentage > 0);
    });

    return rawProducts.map(p => {
      const rawBasePrice = p.price || 0;
      const rawComparePrice = p.compareAtPrice && p.compareAtPrice > rawBasePrice ? p.compareAtPrice : null;

      let baseDiscountPercentage = p.baseDiscount || (rawComparePrice ? Math.round(((rawComparePrice - rawBasePrice) / rawComparePrice) * 100) : 0);

      // Find matching offer for this product's category or "All Categories"
      const prodCat = (p.category || "").toLowerCase();
      const matchingOffer = activeFloatingOffers.find(b => {
        const targetCat = (b.targetCategory || "All Categories").toLowerCase();
        return targetCat === "all categories" || targetCat === "all products" || targetCat === prodCat;
      });

      let floatingDiscount = matchingOffer ? (matchingOffer.discountPercentage || 0) : 0;
      let effectiveDiscount = Math.max(baseDiscountPercentage, floatingDiscount);

      let originalPrice = rawComparePrice || null;
      let finalPrice = rawBasePrice;

      if (floatingDiscount > 0 && floatingDiscount >= baseDiscountPercentage) {
        // Floating offer applies
        originalPrice = rawBasePrice;
        finalPrice = Math.round(rawBasePrice * (1 - floatingDiscount / 100));
      } else if (baseDiscountPercentage > 0 && rawComparePrice) {
        originalPrice = rawComparePrice;
        finalPrice = rawBasePrice;
      }

      return {
        ...p,
        price: finalPrice,
        originalPrice: originalPrice && originalPrice > finalPrice ? originalPrice : null,
        discount: effectiveDiscount,
        hasFloatingOffer: floatingDiscount > 0,
        floatingOfferPercentage: floatingDiscount,
        floatingOfferCategory: matchingOffer?.targetCategory || "All Categories",
        floatingOfferBannerTitle: matchingOffer?.title || ""
      };
    });
  }, [rawProducts, banners]);

  const [settings, setSettings] = useState({
    contactEmail: "hello@reetsutra.com",
    contactPhone: "+91 76439 30659",
    contactAddress: "Patna, Bihar, India",
    socialInstagram: "https://instagram.com/reetsutra",
    socialFacebook: "https://facebook.com/reetsutra",
    socialYoutube: "https://youtube.com/@reetsutra",
    socialTelegram: "https://t.me/reetsutra",
    socialWhatsapp: getWhatsAppUrl(),
    socialTwitter: "https://twitter.com/reetsutra",
    socialLinkedin: "https://linkedin.com/company/reetsutra"
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`);
      const resJson = await response.json();
      if (response.ok && resJson.success && resJson.data) {
        setSettings({
          ...resJson.data,
          socialWhatsapp: getWhatsAppUrl()
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings in frontend:", err);
    }
  }, []);

  // Fetch initially, 15s polling, and instant tab-focus revalidation
  useEffect(() => {
    fetchProducts();
    fetchBanners();
    fetchSettings();
    fetchCategories();

    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchProducts();
      fetchBanners();
      fetchSettings();
      fetchCategories();
    }, 5000);

    const handleTabFocus = () => {
      if (!document.hidden) {
        fetchProducts();
        fetchBanners();
        fetchSettings();
        fetchCategories();
      }
    };

    window.addEventListener("focus", handleTabFocus);
    document.addEventListener("visibilitychange", handleTabFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleTabFocus);
      document.removeEventListener("visibilitychange", handleTabFocus);
    };
  }, [fetchProducts, fetchBanners, fetchSettings, fetchCategories]);

  // Helper to map backend order details to frontend expected structures
  const mapOrderData = useCallback((order) => {
    if (!order) return order;
    return {
      ...order,
      id: order._id || order.id,
      date: order.createdAt || order.date,
      status: order.orderStatus || order.status,
      items: (order.items || []).map(item => {
        const nameStr = item.productName || item.product?.name || item.name || "Traditional Item";
        const isFreeSample = item.isSample || item.price === 0 || nameStr.toLowerCase().includes("sample");
        const defaultSampleImg = "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=400&q=80";
        const rawImg = item.image || item.product?.image || (isFreeSample ? defaultSampleImg : "");
        const formattedImg = getFrontendImageUrl(rawImg) || (isFreeSample ? defaultSampleImg : "");
        return {
          ...item,
          name: nameStr,
          price: item.price !== undefined ? item.price : (item.product?.price || 0),
          originalPrice: item.originalPrice || 70,
          image: formattedImg,
          isSample: isFreeSample,
          product: {
            name: nameStr,
            price: item.price || item.product?.price || 0,
            discount: item.discount || item.product?.discount || 0,
            image: formattedImg,
            category: item.category || item.product?.category || "Traditional Food"
          }
        };
      }),
      trackingTimeline: (order.timeline || order.trackingTimeline || []).map(log => ({
        status: log.status,
        time: new Date(log.date || log.time).toLocaleString(),
        completed: true
      }))
    };
  }, []);

  // Fetch Customer Addresses
  const fetchAddresses = useCallback(async (activeToken) => {
    if (!activeToken || !user.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${user.id}/addresses`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        const mapped = (resJson.data || []).map(addr => ({
          ...addr,
          id: addr._id || addr.id,
          street: addr.line || addr.street,
          type: addr.tag || addr.type
        }));
        setAddresses(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  }, [user.id]);

  // Fetch and Poll Customer Orders (My Orders / Tracking Timeline)
  const fetchOrders = useCallback(async (activeToken) => {
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        const mapped = (resJson.data.orders || []).map(mapOrderData);
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
    }
  }, [mapOrderData]);

  // Initialize and poll orders & addresses when token changes
  useEffect(() => {
    if (!token) {
      setOrders([]);
      setAddresses([]);
      return;
    }

    fetchOrders(token);
    fetchAddresses(token);

    // Setup 30s Smart Polling for user orders when active tab is visible
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchOrders(token);
    }, 30000);

    return () => clearInterval(interval);
  }, [token, fetchOrders, fetchAddresses]);

  // Persist State
  useEffect(() => {
    localStorage.setItem('reetsutra_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('reetsutra_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Helper to safely extract product identifier
  const getProdKey = (p) => String(p?.id || p?._id || p?.sku || "");

  // Cart Functions
  const addToCart = (productId, quantity = 1) => {
    const targetKey = String(productId);
    const product = products.find(p => getProdKey(p) === targetKey || String(p.id) === targetKey || String(p._id) === targetKey);
    if (!product) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => getProdKey(item.product) === targetKey);
      if (existing) {
        return prevCart.map(item =>
          getProdKey(item.product) === targetKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });

    setLastAddedItem({ product, quantity });
    setShowCartPopup(true);

    if (popupTimeoutId) clearTimeout(popupTimeoutId);

    const tId = setTimeout(() => {
      setShowCartPopup(false);
    }, 4000);
    setPopupTimeoutId(tId);
  };

  const removeFromCart = (productId) => {
    const targetKey = String(productId);
    setCart(prevCart => prevCart.filter(item => getProdKey(item.product) !== targetKey));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const targetKey = String(productId);
    setCart(prevCart =>
      prevCart.map(item =>
        getProdKey(item.product) === targetKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Functions
  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  // Address Functions (Persisted in Backend)
  const addAddress = async (newAddr) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken || !user.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${user.id}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify(newAddr)
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        const mappedAddr = {
          ...resJson.data,
          id: resJson.data._id || resJson.data.id,
          street: resJson.data.line || resJson.data.street,
          type: resJson.data.tag || resJson.data.type
        };
        setAddresses(prev => [...prev, mappedAddr]);
        showToast("New delivery address saved successfully.", "success");
        return mappedAddr;
      } else {
        showToast(resJson.message || "Failed to add address.");
      }
    } catch (err) {
      console.error("Failed to add address:", err);
      showToast("Error adding address.");
    }
  };

  const deleteAddress = async (addressId) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken || !user.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${user.id}/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId && addr._id !== addressId));
        showToast("Address deleted successfully.", "success");
      } else {
        showToast(resJson.message || "Failed to delete address.");
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      showToast("Error deleting address.");
    }
  };

  const updateAddress = async (addressId, updatedFields) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken || !user.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${user.id}/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        const mappedAddr = {
          ...resJson.data,
          id: resJson.data._id || resJson.data.id,
          street: resJson.data.line || resJson.data.street,
          type: resJson.data.tag || resJson.data.type
        };
        setAddresses(prev => prev.map(addr => addr.id === addressId ? mappedAddr : addr));
        showToast("Address updated successfully.", "success");
        return mappedAddr;
      } else {
        showToast(resJson.message || "Failed to update address.");
      }
    } catch (err) {
      console.error("Failed to update address:", err);
      showToast("Error updating address.");
    }
  };

  const setDefaultAddress = async (addressId) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken || !user.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${user.id}/addresses/${addressId}/default`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return;
      }
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: addr.id === addressId })));
        showToast("Default address updated.", "success");
      } else {
        showToast(resJson.message || "Failed to set default address.");
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
      showToast("Error setting default address.");
    }
  };

  // Profile Functions (Persisted in Backend)
  const updateProfile = async (profileData) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        })
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return false;
      }
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        const updatedUser = {
          ...user,
          ...resJson.data.user,
          isLoggedIn: true
        };
        setUser(updatedUser);
        localStorage.setItem("reetsutra_user", JSON.stringify(updatedUser));
        showToast("Profile credentials updated successfully.", "success");
        return true;
      } else {
        showToast(resJson.message || "Failed to update profile.");
        return false;
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast("Error updating profile.");
      return false;
    }
  };



  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Login failed.");
      }

      const { token: newToken, user: userProfile } = resJson.data;

      localStorage.setItem("rs_token", newToken);
      localStorage.setItem("reetsutra_user", JSON.stringify({ ...userProfile, isLoggedIn: true }));

      setToken(newToken);
      setUser({ ...userProfile, isLoggedIn: true });
      showToast("Welcome back! Login successful.", "success");
      return true;
    } catch (err) {
      showToast(`Login failed: ${err.message}`);
      return false;
    }
  };

  const register = async (name, email, password, address = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address ? { name, email, password, address } : { name, email, password })
      });
      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Registration failed.");
      }

      const { token: newToken, user: userProfile } = resJson.data;

      localStorage.setItem("rs_token", newToken);
      localStorage.setItem("reetsutra_user", JSON.stringify({ ...userProfile, isLoggedIn: true }));

      setToken(newToken);
      setUser({ ...userProfile, isLoggedIn: true });
      showToast("Account created successfully. Welcome to ReetSutra!", "success");
      return true;
    } catch (err) {
      showToast(`Registration failed: ${err.message}`);
      return false;
    }
  };

  const sendOTP = async (phone, password = null, isLogin = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, isLogin })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Failed to send OTP.");
      }
      showToast(resJson.message, "success");
      return resJson.data;
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const verifyOTPLogin = async (phone, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "OTP Verification failed.");
      }

      const { token: newToken, user: userProfile } = resJson.data;

      localStorage.setItem("rs_token", newToken);
      localStorage.setItem("reetsutra_user", JSON.stringify({ ...userProfile, isLoggedIn: true }));

      setToken(newToken);
      setUser({ ...userProfile, isLoggedIn: true });
      showToast("Welcome back! Login successful.", "success");
      return true;
    } catch (err) {
      showToast(err.message);
      return false;
    }
  };

  const registerWithOTP = async (name, email, phone, password, otp, address) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, otp, address })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Registration failed.");
      }

      const { token: newToken, user: userProfile } = resJson.data;

      localStorage.setItem("rs_token", newToken);
      localStorage.setItem("reetsutra_user", JSON.stringify({ ...userProfile, isLoggedIn: true }));

      setToken(newToken);
      setUser({ ...userProfile, isLoggedIn: true });
      showToast("Registration completed & logged in automatically!", "success");
      return true;
    } catch (err) {
      showToast(err.message);
      return false;
    }
  };

  const changePhoneWithOTP = async (newPhone, otp) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({ newPhone, otp })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Failed to update phone number.");
      }

      const updatedUser = {
        ...user,
        ...resJson.data.user,
        isLoggedIn: true
      };
      setUser(updatedUser);
      localStorage.setItem("reetsutra_user", JSON.stringify(updatedUser));
      showToast("Mobile number verified and updated successfully!", "success");
      return true;
    } catch (err) {
      showToast(err.message);
      return false;
    }
  };

  const changeEmailWithOTP = async (newEmail, otp) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({ newEmail, otp })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Failed to update email address.");
      }

      const updatedUser = {
        ...user,
        ...resJson.data.user,
        isLoggedIn: true
      };
      setUser(updatedUser);
      localStorage.setItem("reetsutra_user", JSON.stringify(updatedUser));
      showToast("Email address verified and updated successfully!", "success");
      return true;
    } catch (err) {
      showToast(err.message);
      return false;
    }
  };

  // Orders Checkout Handler (POST /api/orders)
  const placeOrder = async (orderData) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) {
      showToast("Please login to place your order.");
      return null;
    }

    try {
      const isBuyNow = !!orderData.buyNowItem;
      const rawItemList = isBuyNow ? [orderData.buyNowItem] : (orderData.checkoutItems || cart);

      const orderItems = rawItemList.map(item => {
        const prod = item.product || item;
        const sellingPrice = prod.price || 0;
        const origPrice = prod.originalPrice || sellingPrice;
        return {
          productId: prod._id || prod.id,
          quantity: item.quantity,
          price: sellingPrice,
          originalPrice: origPrice,
          hasFloatingOffer: Boolean(prod.hasFloatingOffer || origPrice > sellingPrice),
          floatingOfferDiscount: (origPrice - sellingPrice) * item.quantity
        };
      });

      // APPEND FREE SAMPLE PRODUCT IF SELECTED BY USER
      if (orderData.selectedSample) {
        const sampleProd = orderData.selectedSample;
        orderItems.push({
          productId: sampleProd.id || sampleProd._id,
          quantity: 1,
          price: 0,
          originalPrice: sampleProd.mrp || 70,
          isSample: true,
          hasFloatingOffer: false,
          floatingOfferDiscount: 0
        });
      }

      const nonSampleItems = orderItems.filter(it => !it.isSample && it.price > 0);
      const computedOriginalSubtotal = nonSampleItems.reduce((acc, it) => acc + (it.originalPrice * it.quantity), 0);
      const computedSubtotal = nonSampleItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const floatingDiscountTotal = Math.max(0, computedOriginalSubtotal - computedSubtotal);

      const payload = {
        items: orderItems,
        shippingAddress: {
          name: orderData.address.name || "",
          phone: orderData.address.phone || "",
          line: orderData.address.street || orderData.address.line || "",
          city: orderData.address.city,
          state: orderData.address.state,
          zip: orderData.address.zip
        },
        billingAddress: orderData.billingAddress || null,
        paymentMethod: orderData.paymentMethod || "COD",
        subtotal: orderData.subtotal !== undefined ? orderData.subtotal : computedSubtotal,
        originalSubtotal: computedOriginalSubtotal,
        floatingDiscountTotal: floatingDiscountTotal,
        shipping: orderData.deliveryCharge !== undefined ? orderData.deliveryCharge : orderData.shipping,
        deliveryCharge: orderData.deliveryCharge,
        discount: orderData.discount || 0,
        couponDiscount: orderData.discount || 0,
        couponCode: orderData.couponCode || "",
        total: orderData.total
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return null;
      }

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Order placement failed.");
      }

      // Add standard fields dynamically for local UI tracking
      const createdOrder = mapOrderData(resJson.data);

      setOrders(prev => [createdOrder, ...prev]);

      if (!isBuyNow) {
        const checkoutList = orderData.checkoutItems || [];
        if (checkoutList.length > 0) {
          checkoutList.forEach(item => {
            const pId = item.product?._id || item.product?.id || item._id || item.id;
            if (pId) removeFromCart(pId);
          });
        } else {
          clearCart();
        }
      } else if (orderData.buyNowItem) {
        const boughtProdId = orderData.buyNowItem.product._id || orderData.buyNowItem.product.id;
        removeFromCart(boughtProdId);
      }

      showToast("Order placed successfully!", "success");
      return createdOrder.id;
    } catch (err) {
      showToast(`Failed to place order: ${err.message}`);
      return null;
    }
  };

  const initializeRazorpayOrder = async (orderData) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) {
      showToast("Please login to place your order.");
      return null;
    }

    try {
      const isBuyNow = !!orderData.buyNowItem;
      const orderItems = isBuyNow
        ? [
          {
            productId: orderData.buyNowItem.product._id || orderData.buyNowItem.product.id,
            quantity: orderData.buyNowItem.quantity
          }
        ]
        : cart.map(item => ({
          productId: item.product._id || item.product.id,
          quantity: item.quantity
        }));

      if (orderData.selectedSample) {
        orderItems.push({
          productId: orderData.selectedSample.id || orderData.selectedSample._id,
          quantity: 1,
          price: 0
        });
      }

      const payload = {
        items: orderItems,
        shippingAddress: {
          name: orderData.address.name || "",
          phone: orderData.address.phone || "",
          line: orderData.address.street || orderData.address.line || "",
          city: orderData.address.city,
          state: orderData.address.state,
          zip: orderData.address.zip
        },
        billingAddress: orderData.billingAddress || null
      };

      const response = await fetch(`${API_BASE_URL}/orders/razorpay/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        logout();
        showToast("Session expired. Please login again.");
        return null;
      }

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Failed to initialize payment order.");
      }

      return resJson.data;
    } catch (err) {
      showToast(`Payment error: ${err.message}`);
      return null;
    }
  };

  const verifyRazorpayPayment = async (verificationData) => {
    const activeToken = localStorage.getItem("rs_token");
    if (!activeToken) {
      showToast("Session expired. Please login again.");
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders/razorpay/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          orderId: verificationData.orderId,
          razorpayOrderId: verificationData.razorpayOrderId,
          razorpayPaymentId: verificationData.razorpayPaymentId,
          razorpaySignature: verificationData.razorpaySignature
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Payment verification failed.");
      }

      const createdOrder = mapOrderData(resJson.data);
      setOrders(prev => [createdOrder, ...prev]);

      const isBuyNow = !!verificationData.buyNowItem;
      if (!isBuyNow) {
        const checkoutList = verificationData.checkoutItems || [];
        if (checkoutList.length > 0) {
          checkoutList.forEach(item => {
            const pId = item.product?._id || item.product?.id || item._id || item.id;
            if (pId) removeFromCart(pId);
          });
        } else {
          clearCart();
        }
      } else if (verificationData.buyNowItem) {
        const boughtProdId = verificationData.buyNowItem.product._id || verificationData.buyNowItem.product.id;
        removeFromCart(boughtProdId);
      }

      showToast("Payment verified and order placed successfully!", "success");
      return true;
    } catch (err) {
      showToast(`Verification failed: ${err.message}`);
      return false;
    }
  };

  const subscribeStockNotification = useCallback(async (productId, emailInput) => {
    try {
      const targetEmail = emailInput || user?.email;
      if (!targetEmail || !targetEmail.trim()) {
        showToast("Please enter a valid email address.", "error");
        return { success: false, message: "Email required" };
      }

      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/products/${productId}/notify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: targetEmail.trim() })
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast(resJson.message, "success");
        return { success: true, message: resJson.message };
      } else {
        showToast(resJson.message || "Failed to register stock notification.", "error");
        return { success: false, message: resJson.message };
      }
    } catch (err) {
      console.error("Stock Notification error:", err);
      showToast("Network error. Please try again.", "error");
      return { success: false, message: err.message };
    }
  }, [user?.email, token, showToast]);

  return (
    <ReetSutraContext.Provider value={{
      products,
      banners,
      fetchProducts,
      settings,
      cart,
      wishlist,
      user,
      addresses,
      orders,
      lastAddedItem,
      showCartPopup,
      setShowCartPopup,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      addAddress,
      deleteAddress,
      updateAddress,
      setDefaultAddress,
      updateProfile,
      login,
      logout,
      register,
      sendOTP,
      verifyOTPLogin,
      registerWithOTP,
      changePhoneWithOTP,
      changeEmailWithOTP,
      placeOrder,
      initializeRazorpayOrder,
      verifyRazorpayPayment,
      subscribeStockNotification,
      showToast,
      toast,
      categoriesList
    }}>
      {children}
      {toast && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from { transform: translateY(-20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .custom-toast-container {
              animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="custom-toast-container fixed top-6 right-6 z-[99999] flex items-center gap-3 bg-brand-ivory border border-brand-gold/30 p-4.5 rounded-lg shadow-2xl max-w-md min-w-[280px]">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-brand-gold/10">
              {toast.type === 'success' ? (
                <span className="text-emerald-600 text-lg font-bold">✓</span>
              ) : (
                <span className="text-rose-600 text-lg font-bold">⚠️</span>
              )}
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">System Notification</h4>
              <p className="text-xs font-semibold text-brand-green leading-normal mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => {
                if (toastTimeoutId) clearTimeout(toastTimeoutId);
                setToast(null);
              }}
              className="text-brand-charcoalLight/50 hover:text-brand-green font-bold text-sm cursor-pointer p-1 text-gray-500 hover:text-gray-800"
              aria-label="Close Toast Notification"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </ReetSutraContext.Provider>
  );
};
export default ReetSutraContext;
