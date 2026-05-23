/**
 * IDF backdrop photos — bundled assets with per-image attribution (CC BY-SA 3.0, Wikimedia / דובר צה״ל).
 * Add new files under src/assets/idf/ and register here with credit + keywords.
 */
import kfirTraining from "../assets/idf/kfir-training.jpg?url";
import borderPrep from "../assets/idf/border-prep.jpg?url";
import nahalMarch from "../assets/idf/nahal-march.jpg?url";
import navyTraining from "../assets/idf/navy-training.jpg?url";
import paratroopers from "../assets/idf/paratroopers.jpg?url";
import alpineTraining from "../assets/idf/alpine-training.jpg?url";
import officerGraduation from "../assets/idf/officer-graduation.jpg?url";
import soldiersSnow from "../assets/idf/soldiers-snow.jpg?url";
import soldiersClimbing from "../assets/idf/soldiers-climbing.jpg?url";

export type IdfPhoto = {
  id: string;
  src: string;
  alt: string;
  /** Full credit line (Hebrew) — show on hover or under image */
  credit: string;
  /** Short line for card overlay */
  creditShort: string;
  /** Wikimedia Commons file page when known */
  commonsUrl?: string;
  keywords: string[];
};

export const IDF_PHOTO_CATALOG: readonly IdfPhoto[] = [
  {
    id: "kfir-training",
    src: kfirTraining,
    alt: "לוחמי חטיבת כפיר באימון שטח",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "לוחמי חטיבת כפיר באימון שטח · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["כפיר", "קרבי", "לוחם", "שטח", "אימון", "חי\"ר", "גיוס", "לחימה", "combat", "field"],
  },
  {
    id: "border-prep",
    src: borderPrep,
    alt: "חיילים בכוננות ליד הגבול",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "חיילים בכוננות ליד הגבול · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["גבול", "שמירה", "כוננות", "אבטחה", "שטח", "סיור", "border"],
  },
  {
    id: "nahal-march",
    src: nahalMarch,
    alt: "חיילי חטיבת הנח״ל בצעדה",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "חיילי חטיבת הנח״ל בצעדה · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["נחל", "נח\"ל", "צעדה", "שטח", "קרבי", "לוחם", "מסע"],
  },
  {
    id: "navy-training",
    src: navyTraining,
    alt: "חיילים באימון בחיל הים",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "אימון בחיל הים · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["ים", "חיל הים", "צוללת", "ספינה", "ים", "navy", "sea", "ימי"],
  },
  {
    id: "paratroopers",
    src: paratroopers,
    alt: "חיילי חטיבת הצנחנים בצעדה",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "חיילי חטיבת הצנחנים בצעדה · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/File:IDF_military_berets._X.jpg",
    keywords: ["צנחנים", "צנח", "קרבי", "לוחם", "שטח", "מסע כומתה"],
  },
  {
    id: "alpine-training",
    src: alpineTraining,
    alt: "חיילים באימון אלפיני",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "אימון אלפיני · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["אלפיני", "הר", "טיפוס", "שטח", "כושר", "פיקוד"],
  },
  {
    id: "officer-graduation",
    src: officerGraduation,
    alt: "טקס סיום קורס קצינים",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "טקס סיום קורס קצינים · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["קצינים", "טקס", "מנהל", "משא", "הדרכה", "משרד", "פיקוד", "admin", "hr", "מנהיגות"],
  },
  {
    id: "soldiers-snow",
    src: soldiersSnow,
    alt: "חיילים באימון בשלג",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "חיילים באימון בשלג · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["שלג", "חורף", "שטח", "אקלים", "סביבה", "רפואה", "טיפול", "welfare", "care"],
  },
  {
    id: "soldiers-climbing",
    src: soldiersClimbing,
    alt: "חיילים באימון מכשולים",
    creditShort: "צילום: יחידת דובר צה״ל",
    credit:
      "חיילים באימון מכשולים · צילום: יחידת דובר צה״ל · רישיון CC BY-SA 3.0 (ויקישיתוף)",
    commonsUrl: "https://commons.wikimedia.org/wiki/Category:Photographs_provided_by_the_IDF_Spokesperson%27s_Unit",
    keywords: ["מכשולים", "כושר", "טיפוס", "סייבר", "מחשב", "טכנולוגיה", "it", "cyber", "data", "מערכות", "תוכנה"],
  },
] as const;

export const IDF_BACKDROP_IMAGE_URLS: readonly string[] = IDF_PHOTO_CATALOG.map((p) => p.src);

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

export const ATTRIBUTION_HE =
  "צילומי רקע: ארכיון דובר צה״ל (יחידת דובר צה״ל), רישיון CC BY-SA 3.0 דרך ויקישיתוף — קרדיט מלא על כל תמונה.";

const catalogById = Object.fromEntries(IDF_PHOTO_CATALOG.map((p) => [p.id, p])) as Record<string, IdfPhoto>;

export function getIdfPhoto(id: string): IdfPhoto {
  return catalogById[id] ?? IDF_PHOTO_CATALOG[0];
}

/** Stable pick for step index, route hash, etc. — spreads across full catalog. */
export function idfPhotoAt(index: number): IdfPhoto {
  const i = ((index % IDF_PHOTO_CATALOG.length) + IDF_PHOTO_CATALOG.length) % IDF_PHOTO_CATALOG.length;
  return IDF_PHOTO_CATALOG[i];
}

export function idfPhotosForIds(ids: string[]): IdfPhoto[] {
  return ids.map((id) => catalogById[id]).filter(Boolean);
}
