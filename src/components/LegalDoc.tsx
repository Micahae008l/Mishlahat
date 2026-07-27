import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, Mail } from "lucide-react";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/brand";

const ease = [0.16, 1, 0.3, 1] as const;

/** Shared shell for /privacy and /terms — plain prose, no photos. */
export function LegalDoc({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="topo-lines" dir="rtl">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-right"
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-dust transition hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            חזרה לאתר
          </Link>
          <p className="mb-3 font-mono text-xs tracking-widest text-primary uppercase">{eyebrow}</p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-[1.75] text-dust">{intro}</p>
          <p className="mt-3 font-mono text-xs text-dust/60">עודכן לאחרונה: {LEGAL_UPDATED}</p>
        </motion.div>

        <div className="mt-12 space-y-10 border-t border-iron/25 pt-10">{children}</div>

        <div className="mt-12 border-t border-iron/25 pt-8 text-right">
          <p className="text-sm text-dust">שאלה על המסמך הזה, בקשה למחיקת מידע, או כל דבר אחר:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

/** One numbered section of a legal document. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="text-right">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-[1.85] text-dust">{children}</div>
    </section>
  );
}

/** Bulleted list with RTL-correct markers. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
