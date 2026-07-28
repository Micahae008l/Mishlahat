/** Hebrew product name */
export const SITE_NAME_HE = "קח כיוון";

/** English / API label */
export const SITE_NAME_EN = "Kach Kivun";

export const SITE_TAGLINE = "הכנה לשירות בצה״ל, בלי רעש";

export const SITE_DESCRIPTION = `${SITE_NAME_HE}, פרופיל, מא״ה, וספירה לגיוס במקום אחד`;

export const CONTACT_EMAIL = "mishlahat.idf@gmail.com";

/** Named as site operator / database owner in the privacy policy and terms */
export const OPERATOR_NAME = "מיכאל חדד";

/** Shown as "last updated" on /privacy and /terms — bump when you edit them */
export const LEGAL_UPDATED = "27 ביולי 2026";

/**
 * Bit payment QR, saved under public/. Empty string hides the whole donate block.
 * If you ever get a Bit *link* too, put it in BIT_DONATE_URL — it turns the QR into
 * a tappable button, which is the only thing that works on phones.
 */
export const BIT_QR_SRC = "";

/** Optional Bit payment-request link (app → בקשת תשלום → שיתוף → העתקת קישור). */
export const BIT_DONATE_URL =
  "https://www.bitpay.co.il/app/me/599F0FEF-6F14-DC48-7E1C-37B1849772F95F55";
