// Centralized API & Backend URL Configuration
const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const defaultBackend = isLocal ? "http://localhost:5000" : "https://backend.reetsutra.com";

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || defaultBackend).replace(/\/$/, '');
export const API_BASE_URL = `${BACKEND_URL}/api`;
export const LIVE_BACKEND_URL = "https://backend.reetsutra.com";

export const getAdminImageUrl = (imgPath) => {
  if (!imgPath) return "";
  if (imgPath.startsWith("data:") || imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }
  return `${BACKEND_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
};

export const handleAdminImageError = (e, fallbackUrl) => {
  const currentSrc = e.target.src || "";
  if (currentSrc && currentSrc.includes("/uploads/") && !currentSrc.startsWith(LIVE_BACKEND_URL)) {
    const relativePath = currentSrc.substring(currentSrc.indexOf("/uploads/"));
    e.target.src = `${LIVE_BACKEND_URL}${relativePath}`;
  } else if (fallbackUrl) {
    e.target.src = fallbackUrl;
  } else {
    e.target.onerror = null;
    e.target.style.display = "none";
  }
};
