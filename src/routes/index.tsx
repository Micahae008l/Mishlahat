import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  ChevronLeft,
  BarChart3,
  Compass,
  Target,
  Lock,
  Shield,
  ArrowUpLeft,
  Star,
  BadgeCheck,
} from "lucide-react";
import { MATCH_TOOL_NAME } from "@/lib/voice";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto, idfPhotoAt, type IdfPhoto } from "@/lib/idf-images";
import { getDashboardStats } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { authedEntryHref } from "@/lib/profile-resume";
import { SITE_NAME_HE } from "@/lib/brand";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

function HomePrimaryCta({ className }: { className: string }) {
  const [mounted, setMounted] = useState(false);
  const [to, setTo] = useState("/post-signup");
  const [label, setLabel] = useState("התחילו בחינם");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) return;
    let cancelled = false;
    getDashboardStats()
      .then((d) => {
        if (cancelled) return;
        const dest = authedEntryHref(d);
        setTo(dest);
        if (dest === "/dashboard") setLabel("לדשבורד שלי");
        else if (dest === "/onboarding") setLabel("השלימו פרופיל");
        else setLabel("המשיכו בהרשמה");
      })
      .catch(() => {
        if (!cancelled) {
          setTo("/post-signup");
          setLabel("המשיכו בהרשמה");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  return (
    <Link to={to} className={className}>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex flex-row-reverse items-center gap-0.5" role="img" aria-label={`${rating} מתוך 5 כוכבים`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-primary text-primary" : "fill-iron/20 text-iron/30"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function avatarTone(name: string): string {
  const tones = [
    "bg-primary/12 text-primary ring-primary/25",
    "bg-olive/12 text-olive ring-olive/25",
    "bg-iron/15 text-foreground ring-iron/30",
  ];
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return tones[n % tones.length];
}

function Testimonial({
  quote,
  name,
  detail,
  idx,
  featured = false,
  rating = 5,
}: {
  quote: string;
  name: string;
  detail: string;
  idx: number;
  featured?: boolean;
  rating?: number;
}) {
  const initial = name.replace(/[^\u0590-\u05FFa-zA-Z]/g, "").charAt(0) || "?";

  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`flex h-full flex-col rounded-sm border bg-card text-right transition-colors hover:border-primary/25 ${
        featured ? "border-primary/30 bg-primary/[0.03] p-7 sm:p-9" : "border-iron/25 p-5 sm:p-6"
      }`}
    >
      <div className="mb-4 flex flex-row items-center justify-between gap-3">
        <StarRating rating={rating} />
        <span className="inline-flex items-center gap-1 rounded-sm border border-iron/20 bg-secondary/50 px-2 py-0.5 font-mono text-[10px] text-dust">
          <BadgeCheck className="h-3 w-3 text-primary/80" aria-hidden />
          בטא מאומת
        </span>
      </div>

      <p
        className={`flex-1 leading-[1.75] text-foreground/92 ${
          featured ? "text-base sm:text-lg" : "text-sm sm:text-[0.9375rem]"
        }`}
      >
        <span className="quote-mark mr-1 inline-block align-top select-none" aria-hidden>
          ״
        </span>
        {quote}
      </p>

      <footer className="mt-5 flex flex-row items-center gap-3 border-t border-iron/15 pt-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${avatarTone(name)}`}
          aria-hidden
        >
          {initial}
        </div>
        <cite className="min-w-0 flex-1 not-italic">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-dust">{detail}</p>
        </cite>
      </footer>
    </motion.blockquote>
  );
}

function HomePage() {
  return (
    <div className="topo-lines">
      {/* ── Hero: asymmetric 5/7 split ── */}
      <section className="relative min-h-[calc(100dvh-3.5rem)]">
        {/* Mobile background slideshow */}
        <div className="absolute inset-0 lg:hidden">
          <HeroSlideshow className="h-full w-full" controls={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-stretch px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:min-h-[calc(100vh-3.5rem)]">
          {/* Text column — right side in RTL */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center py-16 lg:py-24"
          >
            <motion.p variants={fadeUp} className="eyebrow mb-6">
              פלטפורמת הכנה לשירות צה״ל
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]"
            >
              שירות מתחיל
              <br />
              <span className="text-primary">בתכנון.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-md text-[0.9375rem] leading-[1.75] text-dust"
            >
              {SITE_NAME_HE} אוספת במקום אחד את מה שבדרך כלל מפוזר: דפ״ר, פרופיל רפואי,
              מא״ה, תאריך גיוס, ו{MATCH_TOOL_NAME} — בעברית, בלי תשלום.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <HomePrimaryCta className="btn-primary px-7 py-3" />
                <Link to="/role-insights" className="link-quiet inline-flex items-center gap-1.5">
                  איך זה עובד
                  <ArrowUpLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-dust/80">
                <Lock className="h-3 w-3 shrink-0" />
                כניסה באימייל וקוד — בלי סיסמה לזכור
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex gap-8 sm:mt-16 sm:gap-12">
              <DataPoint value="+118" label="תפקידים במאגר" />
              <DataPoint value="12" label="ממדי מא״ה" />
              <DataPoint value="4" label="דק׳ לפרופיל בסיסי" />
            </motion.div>
          </motion.div>

          {/* Slideshow — left side in RTL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="relative hidden min-h-[420px] lg:block lg:min-h-0"
          >
            <div className="absolute inset-y-0 left-0 right-6">
              <HeroSlideshow className="h-full min-h-[420px] rounded-sm border border-iron/25" />
            </div>
          </motion.div>
        </div>

      </section>

      <div className="section-divider" />

      {/* ── Capabilities — staggered asymmetric cards ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, ease }}
            className="mb-14 max-w-xl text-right"
          >
            <p className="eyebrow eyebrow-accent mb-3">מה יש כאן</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              שלושה דברים שכדאי לעשות לפני הגיוס
            </h2>
            <p className="mt-3 max-w-lg text-[0.9375rem] leading-[1.7] text-dust">
              לא צריך לפתוח חמישה טאבים. הפרופיל, הספירה לאחור וההתאמה יושבים באותו מקום.
            </p>
          </motion.div>

          <div className="grid gap-px bg-iron/20 grid-cols-1 sm:grid-cols-3">
            <CapabilityCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="מעקב נתונים"
              description="דפ״ר, רפואי ומא״ה — עם ספירה לאחור לתאריך הגיוס, אם הזנתם אותו."
              photo={idfPhotoAt(0)}
              idx={0}
            />
            <CapabilityCard
              icon={<Target className="h-5 w-5" />}
              title="התאמת תפקיד"
              description="מצליבים את מה שמילאתם מול מאגר תפקידים ומחזירים כמה אפשרויות עם ציון והסבר."
              photo={idfPhotoAt(1)}
              idx={1}
            />
            <CapabilityCard
              icon={<Compass className="h-5 w-5" />}
              title={MATCH_TOOL_NAME}
              description="אחרי שמילאתם פרופיל — מקבלים רשימת תפקידים עם ציון התאמה ותקציר לכל אחד."
              photo={idfPhotoAt(2)}
              idx={2}
            />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Sample result preview ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, ease }}
            className="mb-10 max-w-xl text-right"
          >
            <p className="eyebrow eyebrow-accent mb-3">דוגמה לתוצאה</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              ככה נראית התאמת תפקידים
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-[1.7] text-dust">
              אחרי שממלאים פרופיל — מקבלים כרטיסים עם ציון התאמה, תיאור קצר ותגיות.
              הנה דוגמה מפרופיל לצורך המחשה.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SampleRoleCard
              title="מודיעין שדה 9900"
              pct={91}
              headline="ניתוח מידע ויזואלי — מתחבר לדפ״ר גבוה ועניין בטכנולוגיה."
              tags={["מודיעין", "טכנולוגי", "משרד"]}
              idx={0}
            />
            <SampleRoleCard
              title="לוחם הנדסה קרבית"
              pct={78}
              headline="שילוב שטח והנדסה — מתאים לפרופיל רפואי גבוה וכושר טוב."
              tags={["קרבי", "שטח", "הנדסה"]}
              idx={1}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 text-center text-xs text-dust/60"
          >
            * דוגמה בלבד — התוצאות האמיתיות מבוססות על הפרופיל שלכם.
          </motion.p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Voices from the field (beta testers) ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease }}
            className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="text-right">
              <p className="eyebrow mb-2">ממגייסים שבדקו את הגרסה</p>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">מה אומרים מגייסי הבטא</h2>
              <p className="mt-2 max-w-md text-sm text-dust">
                ציטוטים אמיתיים — שמות מקוצרים בכוונה.
              </p>
            </div>
            <div className="flex shrink-0 flex-row-reverse items-center gap-3 rounded-sm border border-iron/25 bg-card px-4 py-3">
              <div className="text-right">
                <p className="font-mono text-2xl font-black tabular-nums leading-none text-foreground">4.9</p>
                <p className="mt-1 text-[10px] text-dust">ממוצע בטא</p>
              </div>
              <StarRating rating={5} />
            </div>
          </motion.div>

          <div className="space-y-4">
            <Testimonial
              featured
              quote="ראיתי תפקיד שלא עלה לי בראש — והוא היה הכי קרוב למה שבאמת מתאים לי."
              name="נועם כ׳"
              detail="לוחם · נח״ל · בטא, מרץ 2026"
              idx={0}
              rating={5}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Testimonial
                quote="סוף סוף ראיתי במקום אחד מה הדפ״ר והרפואי שלי אומרים ביחד, בלי לחפש בקבוצות וואטסאפ."
                name="שירה ד׳"
                detail="קצינה · חיל האוויר"
                idx={1}
                rating={5}
              />
              <Testimonial
                quote="לא ציפיתי שזה יציע משהו חדש — אבל שתי ההמלצות הראשונות היו הגיוניות ברמה מבהילה."
                name="איתי מ׳"
                detail="תותחן · חיל התותחנים"
                idx={2}
                rating={5}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Evidence: photo + text, offset grid ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/3] overflow-hidden rounded-sm"
            >
              <IdfPhotoPanel
                photo={getIdfPhoto("s8")}
                aspectClassName="h-full min-h-0"
                overlayClassName="from-background/20 via-transparent to-background/60"
                imgClassName="object-[center_40%]"
                loading="lazy"
                fetchPriority="auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: 0.1, ease }}
              className="text-right"
            >
              <p className="eyebrow eyebrow-accent mb-3">איך זה עובד</p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                מהנתונים שלכם לרשימת תפקידים
              </h2>
              <p className="mt-4 max-w-lg text-[0.9375rem] leading-[1.75] text-dust">
                ממלאים דפ״ר, רפואי ומא״ה. אחר כך מריצים את {MATCH_TOOL_NAME} — מקבלים
                7 הצעות עם ציון התאמה ומשפט למה זה מתחבר לפרופיל — אותם תפקידים בכל הרצה עם אותו פרופיל.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 border-t border-iron/30 pt-8 sm:grid-cols-3 sm:gap-6">
                <StepBlock num="01" title="הרשמה" desc="אימייל וקוד, בלי סיסמה" idx={0} />
                <StepBlock num="02" title="פרופיל" desc="דפ״ר, רפואי, מא״ה והעדפות" idx={1} />
                <StepBlock num="03" title="התאמה" desc="רשימת תפקידים עם הסבר" idx={2} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Trust — horizontal bar ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
            className="mb-10 text-center eyebrow"
          >
            פרטיות ושקיפות
          </motion.p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <TrustBlock icon={<Lock className="h-5 w-5" />} title="הנתונים שלכם" desc="גישה רק אחרי התחברות. לא מפרסמים את הפרופיל ולא מוכרים רשימות תפוצה." idx={0} />
            <TrustBlock icon={<Shield className="h-5 w-5" />} title="לא המלצה רשמית" desc="התוצאות מבוססות על מה שהזנתם — לא תחליף ללשכת הגיוס או לקצין." idx={1} />
            <TrustBlock icon={<Target className="h-5 w-5" />} title="בלי כסף" desc="אין מנוי, אין פרסומות. הפרויקט בבטא ונבנה לשימוש חופשי." idx={2} />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── CTA with photo ── */}
      <section className="py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease }}
          className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12"
        >
          <div className="order-2 lg:order-1 overflow-hidden rounded-sm border border-iron/30">
            <IdfPhotoPanel
              photo={getIdfPhoto("s4")}
              aspectClassName="aspect-[16/10] min-h-[220px]"
              overlayClassName="from-background/25 via-background/45 to-background/80"
              loading="lazy"
              fetchPriority="auto"
            />
          </div>
          <div className="order-1 lg:order-2 max-w-xl text-right">
            <h2 className="text-3xl font-bold sm:text-4xl">
              מוכנים לפתוח פרופיל?
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-dust">
              כמה דקות עכשיו — פחות בלבול אחר כך.
            </p>
            <HomePrimaryCta className="mt-8 btn-primary px-7 py-3" />
            <p className="mt-3 flex items-center gap-1.5 text-xs text-dust/80">
              <Lock className="h-3 w-3 shrink-0" />
              אימייל וקוד בלבד
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function DataPoint({ value, label }: { value: string; label: string }) {
  const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const prefix = value.startsWith("+") ? "+" : "";
  const suffix = value.replace(/[+0-9]/g, "");
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated || !ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasAnimated(true);
        obs.disconnect();
        const duration = 800;
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * num));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [hasAnimated, num]);

  return (
    <div className="text-right" ref={ref}>
      <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
        {prefix}{display}{suffix}
      </p>
      <p className="mt-0.5 text-xs text-dust">{label}</p>
    </div>
  );
}

function CapabilityCard({
  icon,
  title,
  description,
  photo,
  idx,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  photo: IdfPhoto;
  idx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden bg-card text-right transition-colors hover:bg-secondary"
    >
      <IdfPhotoPanel
        photo={photo}
        aspectClassName="aspect-[21/9]"
        overlayClassName="from-background/70 via-background/85 to-background"
        showCredit={false}
        loading="lazy"
        fetchPriority="auto"
      />
      <div className="p-5 sm:p-8">
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-dust">{description}</p>
      </div>
    </motion.div>
  );
}

function StepBlock({ num, title, desc, idx }: { num: string; title: string; desc: string; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: 0.15 + idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="text-right"
    >
      <p className="font-mono text-xs font-bold text-primary mb-2">{num}</p>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-dust leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function SampleRoleCard({
  title,
  pct,
  headline,
  tags,
  idx,
}: {
  title: string;
  pct: number;
  headline: string;
  tags: string[];
  idx: number;
}) {
  const r = 27;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="border border-iron/30 bg-card p-6 text-right sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
          <svg width={64} height={64} className="-rotate-90" aria-hidden>
            <circle cx={32} cy={32} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-iron/30" />
            <motion.circle
              cx={32} cy={32} r={r} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round"
              className="text-primary"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: offset }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums text-foreground">
            <span className="text-lg font-black">{pct}</span>
            <span className="text-[9px] text-dust">%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-dust">{headline}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-sm border border-iron/25 bg-secondary/60 px-2.5 py-1 text-[11px] text-dust"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function TrustBlock({ icon, title, desc, idx = 0 }: { icon: React.ReactNode; title: string; desc: string; idx?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group border border-iron/20 border-r-primary/40 bg-card p-8 text-right transition-colors hover:border-r-primary/70"
    >
      <div className="mb-4 text-primary opacity-80">{icon}</div>
      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm leading-[1.7] text-dust">{desc}</p>
    </motion.div>
  );
}
