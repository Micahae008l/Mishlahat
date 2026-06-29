import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SITE_NAME_HE } from "@/lib/brand";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: `מדיניות פרטיות | ${SITE_NAME_HE}` },
      { name: "description", content: `מדיניות הפרטיות של ${SITE_NAME_HE} — איך אנחנו שומרים על המידע שלכם.` },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-8"
      >
        <div className="border-b border-iron/30 pb-6">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-dust transition hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            חזרה לאתר
          </Link>
          <h1 className="text-3xl font-black text-foreground">מדיניות פרטיות</h1>
          <p className="mt-2 text-sm text-dust">עדכון אחרון: יוני 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-[1.8] text-dust">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">אילו נתונים אנחנו אוספים</h2>
            <p>
              {SITE_NAME_HE} אוספת את המידע שאתם מזינים בפרופיל בלבד: כתובת אימייל, שם תצוגה,
              ציוני דפ״ר ופרופיל רפואי, ממדי מא״ה, העדפות שירות ותאריך גיוס משוער.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">איך אנחנו משתמשים בנתונים</h2>
            <p>
              הנתונים משמשים אך ורק להפעלת השירות: הצגת דשבורד אישי, התאמת תפקידים ויצירת דוחות.
              אנחנו לא מוכרים מידע לצד שלישי, לא מפרסמים את הפרופיל שלכם, ולא שולחים רשימות תפוצה.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">אחסון ואבטחה</h2>
            <p>
              המידע מאוחסן בשרתים מאובטחים. גישה לפרופיל מתאפשרת רק באמצעות אימות אימייל וקוד חד-פעמי.
              אנחנו לא שומרים סיסמאות.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">מחיקת מידע</h2>
            <p>
              אם תרצו למחוק את החשבון והנתונים שלכם — פנו אלינו ונטפל בזה.
              הפרויקט בבטא ואנחנו מתכננים להוסיף אפשרות מחיקה עצמית בהמשך.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">שימוש ב-AI</h2>
            <p>
              התאמת תפקידים ודוחות מופקים באמצעות בינה מלאכותית (OpenAI).
              הנתונים שלכם נשלחים ל-API של OpenAI לצורך עיבוד בלבד — לא לאימון מודלים.
              התוצאות אינן המלצה רשמית ואינן מחליפות את לשכת הגיוס.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">יצירת קשר</h2>
            <p>
              שאלות על פרטיות? שלחו מייל ונחזור אליכם בהקדם.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
