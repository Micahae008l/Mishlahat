import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  BarChart3,
  Brain,
  Target,
  Lock,
  Shield,
  ArrowUpLeft,
} from "lucide-react";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto, idfPhotoAt, type IdfPhoto } from "@/lib/idf-images";
import { getDashboardStats } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { authedEntryHref } from "@/lib/profile-resume";

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
  const [label, setLabel] = useState("התחברו עכשיו");

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

function HomePage() {
  return (
    <div className="topo-lines">
      {/* ── Hero: asymmetric 5/7 split ── */}
      <section className="min-h-[calc(100dvh-3.5rem)]">
        <div className="mx-auto grid max-w-7xl items-stretch px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:min-h-[calc(100vh-3.5rem)]">
          {/* Text column — right side in RTL */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center py-16 lg:py-24"
          >
            <motion.p
              variants={fadeUp}
              className="font-mono text-xs tracking-widest text-dust uppercase mb-6"
            >
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
              className="mt-6 max-w-md text-base leading-[1.7] text-dust"
            >
              על מדים מרכזת את כל מה שצריך לדעת לפני ובמהלך השירות בצה&quot;ל.
              נתונים אישיים, ציונים, מסלול תפקיד, ויועץ AI. במקום אחד, בעברית, בחינם.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
              <HomePrimaryCta className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]" />
              <Link
                to="/role-insights"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-dust transition hover:text-foreground"
              >
                מה זה בכלל
                <ArrowUpLeft className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex gap-6 sm:mt-16 sm:gap-10">
              <DataPoint value="+120" label="תפקידים" />
              <DataPoint value="12" label="ממדי מא״ה" />
              <DataPoint value="3 דק׳" label="זמן הרשמה" />
            </motion.div>
          </motion.div>

          {/* Photo column — left side in RTL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-y-0 left-0 right-6 overflow-hidden">
              <IdfPhotoPanel
                photo={getIdfPhoto("paratroopers")}
                className="h-full"
                aspectClassName="h-full min-h-0"
                overlayClassName="from-background via-background/40 to-transparent"
                imgClassName="object-[center_30%]"
              />
            </div>
          </motion.div>
        </div>

        {/* Mobile hero image */}
        <div className="relative aspect-[16/9] lg:hidden overflow-hidden">
          <IdfPhotoPanel
            photo={getIdfPhoto("kfir-training")}
            aspectClassName="h-full min-h-0"
            overlayClassName="from-background via-background/50 to-transparent"
            imgClassName="object-[center_30%]"
          />
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
            <p className="font-mono text-xs tracking-widest text-primary uppercase mb-3">כלים</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              שלושה כלים, מסך אחד
            </h2>
            <p className="mt-3 text-base text-dust leading-relaxed">
              כל מה שצריך כדי להתכונן לשירות, מרוכז ונגיש.
            </p>
          </motion.div>

          <div className="grid gap-px bg-iron/20 grid-cols-1 sm:grid-cols-3">
            <CapabilityCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="מעקב נתונים"
              description='דפ״ר, פרופיל רפואי, ויום המאה. הכל במסך אחד עם ספירה לאחור חיה.'
              photo={idfPhotoAt(0)}
              idx={0}
            />
            <CapabilityCard
              icon={<Target className="h-5 w-5" />}
              title="התאמת תפקיד"
              description="מנוע התאמה שמצליב נתונים מול 120+ תפקידים בצה״ל ומציג אחוזי דיוק."
              photo={idfPhotoAt(1)}
              idx={1}
            />
            <CapabilityCard
              icon={<Brain className="h-5 w-5" />}
              title="יועץ AI אישי"
              description="יועץ מבוסס AI שמנתח את הפרופיל שלכם ונותן המלצות מותאמות אישית."
              photo={idfPhotoAt(2)}
              idx={2}
            />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Evidence: photo + text, offset grid ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[4/3] overflow-hidden rounded-sm"
            >
              <IdfPhotoPanel
                photo={getIdfPhoto("nahal-march")}
                aspectClassName="h-full min-h-0"
                overlayClassName="from-background/20 via-transparent to-background/60"
                imgClassName="object-[center_40%]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: 0.1, ease }}
              className="text-right"
            >
              <p className="font-mono text-xs tracking-widest text-olive uppercase mb-3">איך זה עובד</p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                מהנתונים שלכם לתפקיד שמתאים
              </h2>
              <p className="mt-4 max-w-lg text-base leading-[1.7] text-dust">
                מילאתם דפ״ר, פרופיל רפואי, וציוני מא״ה. המערכת מצליבה את הנתונים
                מול מאגר של מאות תפקידים בצה״ל ומחזירה חמש המלצות מפורטות, מנומקות,
                עם אחוזי התאמה.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 border-t border-iron/30 pt-8 sm:grid-cols-3 sm:gap-6">
                <StepBlock num="01" title="הרשמה" desc="חשבון חינמי תוך 3 דקות" />
                <StepBlock num="02" title="נתונים" desc='דפ״ר, רפואי, מא״ה והעדפות' />
                <StepBlock num="03" title="תובנות" desc="התאמה + המלצות AI" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Trust — horizontal bar ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-px bg-iron/20 sm:grid-cols-3">
            <TrustBlock icon={<Lock className="h-4 w-4" />} title="הצפנה מקצה לקצה" desc="כל הנתונים מוצפנים ומאובטחים." />
            <TrustBlock icon={<Shield className="h-4 w-4" />} title="פרטיות מלאה" desc="לא משתפים מידע עם צד שלישי." />
            <TrustBlock icon={<Target className="h-4 w-4" />} title="חינם לשימוש" desc="ללא תשלום, ללא מנוי, ללא פרסומות." />
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
              photo={getIdfPhoto("navy-training")}
              aspectClassName="aspect-[16/10] min-h-[220px]"
              overlayClassName="from-background/25 via-background/45 to-background/80"
            />
          </div>
          <div className="order-1 lg:order-2 max-w-xl text-right">
            <h2 className="text-3xl font-bold sm:text-4xl">
              השירות שלכם,{" "}
              <span className="text-primary">בראש שקט.</span>
            </h2>
            <p className="mt-4 text-base text-dust">
              בחינם, בעברית, ועם פרטיות מלאה.
            </p>
            <HomePrimaryCta className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]" />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function DataPoint({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-right">
      <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{value}</p>
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden bg-card text-right transition-colors hover:bg-secondary"
    >
      <IdfPhotoPanel
        photo={photo}
        aspectClassName="aspect-[21/9]"
        overlayClassName="from-background/70 via-background/85 to-background"
        showCredit={false}
      />
      <div className="p-5 sm:p-8">
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-dust">{description}</p>
      </div>
    </motion.div>
  );
}

function StepBlock({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="text-right">
      <p className="font-mono text-xs font-bold text-primary mb-2">{num}</p>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-dust leading-relaxed">{desc}</p>
    </div>
  );
}

function TrustBlock({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-card p-6 text-right">
      <div className="flex items-center justify-end gap-2 text-sm font-semibold text-foreground mb-2">
        <span>{title}</span>
        <span className="text-olive">{icon}</span>
      </div>
      <p className="text-xs text-dust leading-relaxed">{desc}</p>
    </div>
  );
}
