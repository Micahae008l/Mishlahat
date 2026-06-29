import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SITE_NAME_HE } from "@/lib/brand";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: `תנאי שימוש | ${SITE_NAME_HE}` },
      { name: "description", content: `תנאי השימוש של ${SITE_NAME_HE}.` },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;

function TermsPage() {
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
          <h1 className="text-3xl font-black text-foreground">תנאי שימוש</h1>
          <p className="mt-2 text-sm text-dust">עדכון אחרון: יוני 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-[1.8] text-dust">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">כללי</h2>
            <p>
              {SITE_NAME_HE} הוא פרויקט עצמאי בבטא. השירות ניתן חינם וללא התחייבות.
              השימוש באתר מהווה הסכמה לתנאים אלו.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">מהות השירות</h2>
            <p>
              האתר מספק כלי עזר להכנה לשירות צבאי: דשבורד אישי, התאמת תפקידים ודוחות מבוססי AI.
              התוצאות מבוססות על הנתונים שאתם מזינים ואינן מהוות המלצה רשמית, ייעוץ מקצועי
              או תחליף ללשכת הגיוס, לקצין המיון או לכל גורם צבאי רשמי.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">אחריות המשתמש</h2>
            <p>
              אתם אחראים לדיוק הנתונים שאתם מזינים. אין להזין מידע של אנשים אחרים ללא הסכמתם.
              אין להשתמש בשירות למטרות לא חוקיות או להפרת פרטיות.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">הגבלת אחריות</h2>
            <p>
              השירות ניתן "כמות שהוא" (AS IS) ללא אחריות מכל סוג.
              אנחנו לא אחראים לנזק שנגרם משימוש בתוצאות האתר, כולל החלטות שנלקחו על בסיס
              התאמת תפקידים או דוחות שהופקו באתר.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">שינויים בשירות</h2>
            <p>
              אנחנו שומרים את הזכות לשנות, להשהות או להפסיק את השירות בכל עת.
              שינויים מהותיים בתנאי השימוש יפורסמו בעמוד זה.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">יצירת קשר</h2>
            <p>
              שאלות? שלחו מייל ונחזור אליכם.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
