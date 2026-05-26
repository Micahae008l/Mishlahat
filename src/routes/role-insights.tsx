import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto, idfPhotoAt } from "@/lib/idf-images";
import placeholderRaw from "../../content/he/role-insights-placeholder.txt?raw";

export const Route = createFileRoute("/role-insights")({
  component: RoleInsightsPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function parseInsightSections(raw: string) {
  return raw
    .split(/\n---\n/)
    .map((block) => {
      const lines = block.trim().split("\n");
      const first = lines[0]?.trim() ?? "";
      let title = "";
      let bodyLines = lines;
      if (first.startsWith("# ")) {
        title = first.slice(2).trim();
        bodyLines = lines.slice(1);
      }
      const body = bodyLines.join("\n").trim();
      return { title, body };
    })
    .filter((s) => s.title || s.body);
}

function RoleInsightsPage() {
  const sections = useMemo(() => parseInsightSections(placeholderRaw), []);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-8 sm:px-8 md:space-y-16 md:py-14 topo-lines">
      {/* Header with photo */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden border border-iron/30 p-5 text-right sm:p-8 md:p-12"
      >
        <IdfPhotoPanel
          photo={getIdfPhoto("paratroopers")}
          aspectClassName="absolute inset-0 min-h-0"
          className="absolute inset-0"
          overlayClassName="from-background/70 via-background/85 to-background"
          imgClassName="object-[center_30%]"
        />
        <div className="relative space-y-4">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            דף עומק
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">תובנות תפקיד</h1>
          <p className="max-w-2xl text-base leading-[1.7] text-dust md:text-lg">
            כאן יתמקד בעתיד כל מה שרציתם לדעת על תפקיד לפני שמחליטים: סביבת עבודה, לחץ, מסלול קורסים, וקשר לפרופיל שלכם.
            התוכן ייווצר מ־AI על בסיס הנתונים שתשלימו במערכת.
          </p>
        </div>
      </motion.header>

      {/* Content sections */}
      <div className="space-y-6 md:space-y-8">
        {sections.map(({ title, body }, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.04, ease }}
            className="overflow-hidden border border-iron/20 bg-card text-right"
          >
            <div className="hidden sm:block border-b border-iron/20">
              <IdfPhotoPanel
                photo={idfPhotoAt(i + 3)}
                aspectClassName="aspect-[24/8]"
                overlayClassName="from-background/40 via-background/60 to-background"
              />
            </div>
            <div className="p-4 sm:p-6 md:p-10">
            {title ? (
              <h2 className="text-xl font-bold text-foreground md:text-2xl mb-5">
                {title}
              </h2>
            ) : null}
            <div className={`space-y-4 text-sm leading-[1.7] text-dust md:text-base`}>
              {body.split(/\n\n+/).map((para, j) => (
                <p key={j}>{para.trim()}</p>
              ))}
            </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* CTA bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 border border-primary/20 bg-primary/[0.03] p-6 text-right sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-dust">
          מוכנים לנסות התאמה ראשונית? היועץ משתמש בדפ״ר וברפואי מהפרופיל.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to="/ai-counselor"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            <ChevronLeft className="h-4 w-4" />
            ליועץ AI
          </Link>
          <Link
            to="/dashboard"
            className="rounded-md border border-iron/40 px-5 py-3 text-sm text-dust transition hover:border-primary/40 hover:text-foreground"
          >
            דשבורד
          </Link>
        </div>
      </div>
    </div>
  );
}
