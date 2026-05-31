/**
 * Site photo catalog — hero slideshow assets used across panels, role cards, and backdrops.
 * Add files under src/assets/hero-slideshow/ and register here.
 */
import slide1 from "@/assets/hero-slideshow/slide-1.jpg?url";
import slide2 from "@/assets/hero-slideshow/slide-2.jpg?url";
import slide3 from "@/assets/hero-slideshow/slide-3.jpg?url";
import slide4 from "@/assets/hero-slideshow/slide-4.jpg?url";
import slide5 from "@/assets/hero-slideshow/slide-5.jpg?url";
import slide6 from "@/assets/hero-slideshow/slide-6.jpg?url";
import slide7 from "@/assets/hero-slideshow/slide-7.jpg?url";
import slide8 from "@/assets/hero-slideshow/slide-8.jpg?url";
import slide9 from "@/assets/hero-slideshow/slide-9.jpg?url";

const CREDIT_SHORT = "צילום: על מדים";
const CREDIT = "צילום שטח בצה״ל — ארכיון על מדים";

export type IdfPhoto = {
  id: string;
  src: string;
  alt: string;
  /** CSS object-position for crops */
  objectPosition?: string;
  credit: string;
  creditShort: string;
  commonsUrl?: string;
  keywords: string[];
};

export const IDF_PHOTO_CATALOG: readonly IdfPhoto[] = [
  {
    id: "s1",
    src: slide1,
    alt: "לוחמים בשקיעה בשטח",
    objectPosition: "center 40%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["שקיעה", "שטח", "לוחם", "קרבי", "חי\"ר", "גיוס", "לחימה", "combat", "field", "שלג", "רפואה", "care"],
  },
  {
    id: "s2",
    src: slide2,
    alt: "טנק מרכבה באימון",
    objectPosition: "center 45%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["טנק", "שריון", "מרכבה", "אימון", "שטח", "קרבי", "armor", "קצינים", "פיקוד", "admin"],
  },
  {
    id: "s3",
    src: slide3,
    alt: "לוחם בלילה עם ציוד טקטי",
    objectPosition: "center 35%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["לילה", "טקטי", "לוחם", "סייבר", "מחשב", "טכנולוגיה", "it", "cyber", "data", "מערכות", "תוכנה"],
  },
  {
    id: "s4",
    src: slide4,
    alt: "כוח בשטח ליד הים",
    objectPosition: "center 50%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["ים", "חיל הים", "ספינה", "חוף", "navy", "sea", "ימי", "שטח"],
  },
  {
    id: "s5",
    src: slide5,
    alt: "לוחמים וטנק בשטח בנוי",
    objectPosition: "center 40%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["טנק", "עיר", "שטח", "לוחם", "קרבי", "כפיר", "אימון", "urban", "combat"],
  },
  {
    id: "s6",
    src: slide6,
    alt: "כוח על תלולית אדמה",
    objectPosition: "center 30%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["גבול", "שמירה", "כוננות", "אבטחה", "שטח", "סיור", "border", "תלולית", "הר"],
  },
  {
    id: "s7",
    src: slide7,
    alt: "טנקים ועשן בשטח",
    objectPosition: "center 45%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["טנק", "עשן", "אימון", "שטח", "קרבי", "לחימה", "armor", "field"],
  },
  {
    id: "s8",
    src: slide8,
    alt: "מסלול לוחמים בהר",
    objectPosition: "center 40%",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: [
      "הר",
      "מסע",
      "נחל",
      "נח\"ל",
      "צנחנים",
      "צנח",
      "כושר",
      "מכשולים",
      "טיפוס",
      "אלפיני",
      "לוחם",
      "מסע כומתה",
    ],
  },
  {
    id: "s9",
    src: slide9,
    alt: "טנק בראיית לילה",
    objectPosition: "center center",
    creditShort: CREDIT_SHORT,
    credit: CREDIT,
    keywords: ["לילה", "טנק", "ראיית לילה", "טכנולוגיה", "מודיעין", "סייבר", "it"],
  },
] as const;

/** Maps old Wikimedia catalog ids → hero slide ids */
export const LEGACY_PHOTO_ALIASES: Record<string, string> = {
  "kfir-training": "s1",
  "border-prep": "s6",
  "nahal-march": "s8",
  "navy-training": "s4",
  paratroopers: "s8",
  "alpine-training": "s8",
  "officer-graduation": "s2",
  "soldiers-snow": "s1",
  "soldiers-climbing": "s8",
};

export const ATTRIBUTION_HE = "צילומי שטח: ארכיון על מדים.";

const catalogById = Object.fromEntries(IDF_PHOTO_CATALOG.map((p) => [p.id, p])) as Record<string, IdfPhoto>;

function resolvePhotoId(id: string): string {
  return LEGACY_PHOTO_ALIASES[id] ?? id;
}

function scorePhoto(photo: IdfPhoto, blob: string): number {
  let score = 0;
  for (const kw of photo.keywords) {
    if (blob.includes(kw.toLowerCase())) score += 2;
  }
  return score;
}

/** Pick a catalog photo: keyword match first, then unique spread across ranks (no repeats in one results set). */
export function pickRolePhoto(
  tags: string[],
  title: string,
  rank: number,
  usedIds: Set<string>
): IdfPhoto {
  const blob = `${tags.join(" ")} ${title}`.toLowerCase();

  const ranked = [...IDF_PHOTO_CATALOG]
    .map((photo) => ({
      photo,
      score: scorePhoto(photo, blob) + (usedIds.has(photo.id) ? -100 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const bestUnused = ranked.find((r) => !usedIds.has(r.photo.id));
  if (bestUnused && bestUnused.score > 0) {
    usedIds.add(bestUnused.photo.id);
    return bestUnused.photo;
  }

  const fallbackIndex = (rank - 1) % IDF_PHOTO_CATALOG.length;
  for (let offset = 0; offset < IDF_PHOTO_CATALOG.length; offset++) {
    const photo = IDF_PHOTO_CATALOG[(fallbackIndex + offset) % IDF_PHOTO_CATALOG.length];
    if (!usedIds.has(photo.id)) {
      usedIds.add(photo.id);
      return photo;
    }
  }

  const photo = IDF_PHOTO_CATALOG[fallbackIndex];
  usedIds.add(photo.id);
  return photo;
}

export const IDF_BACKDROP_IMAGE_URLS: readonly string[] = IDF_PHOTO_CATALOG.map((p) => p.src);

export function getIdfPhoto(id: string): IdfPhoto {
  const resolved = resolvePhotoId(id);
  return catalogById[resolved] ?? IDF_PHOTO_CATALOG[0];
}

/** Stable pick for step index, route hash, etc. — spreads across full catalog. */
export function idfPhotoAt(index: number): IdfPhoto {
  const i = ((index % IDF_PHOTO_CATALOG.length) + IDF_PHOTO_CATALOG.length) % IDF_PHOTO_CATALOG.length;
  return IDF_PHOTO_CATALOG[i];
}

export function idfPhotosForIds(ids: string[]): IdfPhoto[] {
  return ids.map((id) => getIdfPhoto(id));
}
