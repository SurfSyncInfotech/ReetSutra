export const DEFAULT_WHATSAPP_NUMBER = "917643930659";
export const DEFAULT_WHATSAPP_MESSAGE = "Hello ReetSutra! I am interested in your products and need some information. Can you please assist me?";
export const FORCED_WHATSAPP_URL = `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`;

export function getWhatsAppUrl() {
  return FORCED_WHATSAPP_URL;
}
