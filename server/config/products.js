/**
 * Sellable products. Prices are in agorot (ILS minor unit) so we never do float math.
 * `grant` is what a paid purchase adds to the user's entitlement:
 *   - reportCredits: prepaid full-report generations
 *   - planDays: days of "pro" plan (unlimited reports + AI while active)
 *
 * Keep ids stable — they are stored on every Payment row.
 */
export const CURRENCY = "ILS";

export const PRODUCTS = [
  {
    id: "report_single",
    type: "credits",
    nameHe: "דוח כיוון מלא",
    descHe: "דוח AI מקיף עם 10 תפקידים, טיפים למיון/ראיון, סיכום להורים וייצוא PDF.",
    priceAgorot: 7900, // ₪79
    grant: { reportCredits: 1 },
  },
  {
    id: "report_pack3",
    type: "credits",
    nameHe: "חבילת 3 דוחות",
    descHe: "שלושה דוחות מלאים — להפקה מחדש אחרי שמעדכנים ציונים או העדפות.",
    priceAgorot: 19900, // ₪199
    grant: { reportCredits: 3 },
  },
  {
    id: "sub_monthly",
    type: "subscription",
    nameHe: "מנוי הכנה חודשי",
    descHe: "דוחות ללא הגבלה, יועץ AI ומזכיר AI — לאורך חודשי ההכנה שלפני הגיוס.",
    priceAgorot: 2900, // ₪29 / חודש
    grant: { planDays: 30 },
  },
];

export function getProduct(productId) {
  return PRODUCTS.find((p) => p.id === productId) || null;
}

/** Shape sent to the frontend pricing page. */
export function publicProduct(p) {
  return {
    id: p.id,
    type: p.type,
    nameHe: p.nameHe,
    descHe: p.descHe,
    priceAgorot: p.priceAgorot,
    priceIls: Math.round(p.priceAgorot / 100),
    currency: CURRENCY,
    grant: p.grant,
  };
}
