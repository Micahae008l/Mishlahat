export type RoleCategory = "combat" | "tech" | "intelligence" | "logistics" | "medical" | "education" | "air" | "navy";

export type RoleInsight = {
  slug: string;
  title: string;
  category: RoleCategory;
  tags: string[];
  shortDescription: string;
  dailyLife: string;
  trainingPath: string;
  requirements: string;
  exitOpportunities: string;
  tips: string;
  minDapar?: number;
  minMedical?: number;
};

export const ROLE_CATEGORIES: Record<RoleCategory, { label: string; color: string }> = {
  combat: { label: "קרבי", color: "text-red-400" },
  tech: { label: "טכנולוגי", color: "text-blue-400" },
  intelligence: { label: "מודיעין", color: "text-purple-400" },
  logistics: { label: "לוגיסטיקה", color: "text-amber-400" },
  medical: { label: "רפואה", color: "text-green-400" },
  education: { label: "הדרכה / חינוך", color: "text-cyan-400" },
  air: { label: "חיל אוויר", color: "text-sky-400" },
  navy: { label: "חיל הים", color: "text-teal-400" },
};

export const ROLE_INSIGHTS: RoleInsight[] = [
  {
    slug: "lohem-hir",
    title: "לוחם חי\"ר",
    category: "combat",
    tags: ["קרבי", "שטח", "פיקוד"],
    shortDescription: "לוחם רגלי בגדודי החי\"ר — גולני, גבעתי, נח\"ל, צנחנים, כפיר. שירות קרבי מלא עם אימונים בשטח.",
    dailyLife: "אימוני שטח, ירי, ניווטים, משמרות שמירה, ותרגילים. בחודשים הראשונים — טירונות ואימון מתקדם. לאחר מכן — פעילות מבצעית בהתאם ליחידה ולאזור הפריסה. יציאות הביתה משתנות: חמשושים עד 21, תלוי במחזור ובמצב הביטחוני.",
    trainingPath: "טירונות (4-6 חודשים) → אימון מתקדם → קורס מ\"כים (אופציונלי) → קורס קצינים (לבוחרים). חלק מהלוחמים עוברים הסמכות נוספות: צלפים, חבלה, לוחמה הנדסית.",
    requirements: "פרופיל רפואי 82+ (לרוב 97 לגולני/צנחנים). דפ\"ר גבוה (60+). כושר גופני גבוה — ריצת 3 ק\"מ מתחת ל-13 דקות מומלץ. מוטיבציה גבוהה.",
    exitOpportunities: "אחרי שירות קרבי — יתרון בקבלה לאוניברסיטאות, תוכניות מנהיגות (עתודה אקדמית), ומקצועות שדורשים עמידות בלחץ. רבים ממשיכים לתפקידי ביטחון, משטרה, או הכשרת מנהלים.",
    tips: "התחילו לרוץ ולהתאמן כמה חודשים לפני הגיוס. הצטרפו לקבוצת ריצה. למדו לישון מעט — זה יעזור. הגיעו עם גישה של \"אני כאן ללמוד\" ולא \"אני יודע הכל\".",
    minDapar: 56,
    minMedical: 82,
  },
  {
    slug: "modi-9900",
    title: "מודיעין שדה 9900",
    category: "intelligence",
    tags: ["מודיעין", "טכנולוגי", "משרד"],
    shortDescription: "ניתוח מידע ויזואלי ומרחבי — מיפוי, תצפיות לווין, וזיהוי מטרות. יחידת מודיעין עם אופי טכנולוגי.",
    dailyLife: "עבודה מול מסכים עם כלי ניתוח מרחבי. ניתוח תצלומי אוויר ולווין, זיהוי שינויים בשטח, הכנת תוצרי מודיעין. סביבת עבודה משרדית ברוב המקרים. שושים או חמשושים.",
    trainingPath: "קורס מקצועי (3-4 חודשים) → התמחות ביחידה → אפשרות להתקדמות לתפקידי פיקוד או הדרכה.",
    requirements: "דפ\"ר 50+, פרופיל רפואי 64+. יתרון לבעלי חשיבה אנליטית, תשומת לב לפרטים, ויכולת עבודה ממושכת מול מסך.",
    exitOpportunities: "יציאה טובה לתחומי GIS, ניתוח מידע, סייבר, ומודיעין עסקי. חברות הייטק מחפשות בוגרי 9900.",
    tips: "התרגלו לעבודה ארוכה מול מחשב. פתחו סקרנות לגאוגרפיה ומפות. ידע בסיסי באנגלית עוזר.",
    minDapar: 50,
    minMedical: 64,
  },
  {
    slug: "sayeret-modiin-8200",
    title: "8200 — יחידת מודיעין טכנולוגי",
    category: "tech",
    tags: ["סייבר", "טכנולוגי", "מודיעין"],
    shortDescription: "יחידת הסייבר והמודיעין הטכנולוגי המרכזית של צה\"ל. תכנות, ניתוח נתונים, אבטחת מידע ומחקר.",
    dailyLife: "תכנות, מחקר, ניתוח נתונים, ועבודה על מערכות מבצעיות. סביבת עבודה דמוית הייטק. שעות גמישות יחסית. חמשושים ברוב המקרים.",
    trainingPath: "מיון (גיבוש + מבחני מיון) → קורס הכשרה (4-8 חודשים, תלוי מסלול) → שיבוץ ביחידה. מסלולים: פיתוח, מחקר, ניתוח מידע, הגנת סייבר.",
    requirements: "דפ\"ר גבוה (60+). פרופיל רפואי 72+. מיון ייחודי הכולל מבחני חשיבה, לוגיקה ותכנות. ידע מוקדם בתכנות — יתרון גדול אבל לא חובה.",
    exitOpportunities: "בוגרי 8200 נחשבים ל\"כרטיס כניסה\" לעולם ההייטק הישראלי. רבים מקימים סטארטאפים או מצטרפים לחברות מובילות. השכר ההתחלתי אחרי שחרור — מהגבוהים בשוק.",
    tips: "התחילו ללמוד Python או JavaScript עכשיו. השתתפו ב-CTF (תחרויות סייבר). פתרו בעיות ב-LeetCode. גם אם אין לכם רקע — הצטרפו לקורסי מגמת סייבר.",
    minDapar: 60,
    minMedical: 72,
  },
  {
    slug: "handasa-kravit",
    title: "לוחם הנדסה קרבית",
    category: "combat",
    tags: ["קרבי", "הנדסה", "שטח"],
    shortDescription: "שילוב לחימה והנדסה — פירוק מוקשים, פריצת מחסומים, בינוי ביצורים, ותמיכה הנדסית בכוחות קרביים.",
    dailyLife: "אימוני שטח עם דגש הנדסי: חבלה, פירוק מוקשים, הפעלת כלי הנדסה כבדים. עבודה צמודה לכוחות קרביים. חלק מהזמן בבסיס, חלק בשטח.",
    trainingPath: "טירונות → אימון מתקדם הנדסי (4 חודשים) → התמחות: חבלנים, נהגי D9, לוחמי מנהרות. קורסי מ\"כים וקצינים פתוחים.",
    requirements: "פרופיל רפואי 82+. דפ\"ר 50+. כושר גופני טוב. יתרון לבעלי חשיבה טכנית ויכולת עבודה תחת לחץ.",
    exitOpportunities: "יציאה לתחומי בנייה, ניהול פרויקטים, הנדסה אזרחית, וביטחון. הניסיון הטכני-מבצעי מוערך בתעשייה.",
    tips: "כושר גופני חשוב, אבל גם חשיבה הנדסית. אם אתם אוהבים לפתור בעיות מעשיות — זה המקום.",
    minDapar: 50,
    minMedical: 82,
  },
  {
    slug: "hovesh-kravi",
    title: "חובש קרבי",
    category: "medical",
    tags: ["רפואה", "קרבי", "שטח"],
    shortDescription: "מטפל רפואי ראשוני בשדה הקרב. שילוב של רפואת חירום ולחימה.",
    dailyLife: "אימונים רפואיים ולחימתיים. בשגרה — טיפול רפואי שוטף לחיילים. במבצע — טיפול בפצועים תחת אש. נלווים ליחידות קרביות.",
    trainingPath: "טירונות → קורס חובשים (3 חודשים) → שיבוץ ביחידה קרבית. אפשרות להתקדם לפרמדיק צבאי.",
    requirements: "פרופיל רפואי 82+. דפ\"ר 50+. עדיפות לבעלי סבלנות, יכולת עבודה תחת לחץ, ועניין ברפואה.",
    exitOpportunities: "מסלול ישיר ללימודי פרמדיקים, סיעוד, ורפואה. הניסיון הקרבי מוערך בשירותי חירום אזרחיים (מד\"א, כיבוי).",
    tips: "למדו עזרה ראשונה מראש. הצטרפו למד\"א כמתנדבים. הכושר הגופני חשוב כמו הידע הרפואי.",
    minDapar: 50,
    minMedical: 82,
  },
  {
    slug: "madrich-chinuchi",
    title: "מדריך חינוכי",
    category: "education",
    tags: ["הדרכה", "חינוך", "מנהיגות"],
    shortDescription: "הדרכת חיילים וצוותים בנושאי ערכים, מנהיגות, ומורשת. תפקיד שמשלב עבודה עם אנשים ויצירתיות.",
    dailyLife: "הכנת הדרכות, הנחיית קבוצות, ליווי מפקדים בנושאי חינוך. עבודה משרדית לצד פעילות שטח. שושים או חמשושים.",
    trainingPath: "קורס מדריכים חינוכיים (3 חודשים) → שיבוץ ביחידה. אפשרות לקורס קצינים חינוך.",
    requirements: "דפ\"ר 45+. פרופיל רפואי 64+. יכולת הבעה, עבודה עם אנשים, ויצירתיות.",
    exitOpportunities: "יציאה מצוינת לתחומי חינוך, הנחיית קבוצות, משאבי אנוש, ופיתוח ארגוני. רבים ממשיכים ללימודי חינוך או פסיכולוגיה.",
    tips: "התנדבו בתנועות נוער או בהדרכה. פתחו יכולת דיבור מול קבוצות. קראו על מנהיגות.",
    minDapar: 45,
    minMedical: 64,
  },
  {
    slug: "tayeset-kravi",
    title: "טייסת קרבית — צוות אוויר",
    category: "air",
    tags: ["חיל אוויר", "טכנולוגי", "תחזוקה"],
    shortDescription: "תחזוקה ותפעול של מטוסים ומסוקים. תפקידים טכניים ברמה גבוהה בתוך טייסות.",
    dailyLife: "תחזוקת מטוסים, בדיקות מערכות, תיקונים. עבודה במתקני חיל האוויר. משמרות מתחלפות. חמשושים ברוב הטייסות.",
    trainingPath: "קורס טכנאי אוויר (6-8 חודשים) → התמחות: מנועים, אלקטרוניקה, חימוש, או מערכות טיסה.",
    requirements: "דפ\"ר 50+. פרופיל רפואי 64+. חשיבה טכנית, דיוק, ויכולת עבודה בצוות.",
    exitOpportunities: "יציאה מצוינת לתחומי תעופה אזרחית, אלקטרוניקה, וטכנולוגיה. רישיון טכנאי אוויר אזרחי — יתרון גדול.",
    tips: "עניין במכניקה ואלקטרוניקה זה הבסיס. אפילו פירוק והרכבה של דברים בבית מראה על הכיוון הנכון.",
    minDapar: 50,
    minMedical: 64,
  },
  {
    slug: "shayetet-13",
    title: "שייטת 13",
    category: "navy",
    tags: ["חיל הים", "קרבי", "מובחר"],
    shortDescription: "יחידת הקומנדו הימי של צה\"ל. אחת היחידות המובחרות ביותר — פעולות מיוחדות בים, ביבשה ומתחת למים.",
    dailyLife: "אימונים אינטנסיביים: שחייה, צלילה, ניווט ימי, ירי, קרב מגע. פעילות מבצעית חסויה. יציאות נדירות.",
    trainingPath: "גיבוש (שבוע) → מסלול הכשרה (20 חודשים) הכולל: שלב ים, שלב יבשה, צלילה, חבלה, צניחה.",
    requirements: "פרופיל רפואי 97. דפ\"ר 72+. כושר גופני ברמה הגבוהה ביותר. עמידות נפשית יוצאת דופן.",
    exitOpportunities: "בוגרי שייטת 13 נחשבים לקרם של צה\"ל. יציאה למגזר העסקי, ייעוץ, הייטק, ותפקידי מנהיגות בכירים.",
    tips: "התאמנו בים — שחייה ארוכה במים פתוחים. רוצו עם משקל. למדו לעבוד כשאתם עייפים. התהליך ארוך — הכינו את עצמכם נפשית.",
    minDapar: 72,
    minMedical: 97,
  },
  {
    slug: "logistika-tikshov",
    title: "תקשוב ולוגיסטיקה",
    category: "logistics",
    tags: ["לוגיסטיקה", "משרד", "מערכות"],
    shortDescription: "ניהול מערכות תקשוב, רשתות, ותשתיות IT בבסיסים ויחידות. תפקיד שמשלב טכנולוגיה וניהול.",
    dailyLife: "התקנה ותחזוקה של מערכות תקשורת, רשתות מחשבים, וציוד IT. עבודה משרדית ברוב הזמן, לפעמים יציאה לשטח. יומיות או חמשושים.",
    trainingPath: "קורס תקשוב (2-3 חודשים) → שיבוץ ביחידה. אפשרות להתמחות במערכות ספציפיות.",
    requirements: "דפ\"ר 40+. פרופיל רפואי 45+. ידע בסיסי במחשבים. סבלנות ודיוק.",
    exitOpportunities: "יציאה ישירה לתחומי IT, סיסטם, רשתות, ו-DevOps. ניסיון מעשי שמוערך בשוק העבודה.",
    tips: "למדו בסיס של רשתות (TCP/IP, DNS). התנסו ב-Linux. הסמכת CompTIA A+ — יתרון.",
    minDapar: 40,
    minMedical: 45,
  },
];

export function getRoleBySlug(slug: string): RoleInsight | undefined {
  return ROLE_INSIGHTS.find((r) => r.slug === slug);
}

function normalizeHe(s: string): string {
  return s
    .replace(/["'״׳()\-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Keyword aliases mapping AI catalog role titles to insight guide slugs. */
const INSIGHT_ALIASES: Array<{ slug: string; keywords: string[] }> = [
  { slug: "lohem-hir", keywords: ["חיר", "גולני", "גבעתי", "נחל", "צנחנים", "כפיר", "לוחם רגלי", "חי\"ר"] },
  { slug: "modi-9900", keywords: ["9900", "מודיעין שדה", "ניתוח ויזואלי", "מיפוי"] },
  { slug: "sayeret-modiin-8200", keywords: ["8200", "סייבר", "מודיעין טכנולוגי", "תכנות", "פיתוח"] },
  { slug: "handasa-kravit", keywords: ["הנדסה קרבית", "חבלן", "הנדסה", "מוקשים"] },
  { slug: "hovesh-kravi", keywords: ["חובש", "פרמדיק", "רפואת חירום"] },
  { slug: "madrich-chinuchi", keywords: ["מדריך", "הדרכה", "חינוכ", "מורשת"] },
  { slug: "tayeset-kravi", keywords: ["טייסת", "טכנאי אוויר", "חיל אוויר", "מטוס", "מסוק"] },
  { slug: "shayetet-13", keywords: ["שייטת", "קומנדו ימי"] },
  { slug: "logistika-tikshov", keywords: ["תקשוב", "רשתות", "לוגיסטיקה", "מערכות מידע", "it"] },
];

/**
 * Bridge between the AI role catalog (Hebrew titles + tags) and the editorial
 * insight guides. Returns the best-matching guide, or undefined when the
 * recommended role has no written guide yet.
 */
export function findInsightForRole(roleTitle: string, tags: string[] = []): RoleInsight | undefined {
  const title = normalizeHe(roleTitle);
  if (!title) return undefined;

  // Exact / containment match against guide titles first
  for (const r of ROLE_INSIGHTS) {
    const t = normalizeHe(r.title);
    if (t === title || title.includes(t) || t.includes(title)) return r;
  }

  // Keyword alias scoring (title hits weigh more than tag hits)
  const tagText = normalizeHe(tags.join(" "));
  let best: { slug: string; score: number } | null = null;
  for (const alias of INSIGHT_ALIASES) {
    let score = 0;
    for (const kw of alias.keywords) {
      const k = normalizeHe(kw);
      if (title.includes(k)) score += 2;
      else if (tagText.includes(k)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { slug: alias.slug, score };
  }
  return best ? getRoleBySlug(best.slug) : undefined;
}

export function getRolesByCategory(category: RoleCategory): RoleInsight[] {
  return ROLE_INSIGHTS.filter((r) => r.category === category);
}
