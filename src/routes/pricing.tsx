import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, FileText, Layers, Repeat, Loader2, ShieldCheck } from "lucide-react";
import { createCheckout, getProducts, getEntitlement, type Product } from "@/lib/api";
import { getToken } from "@/lib/auth";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const PRODUCT_ICON: Record<string, typeof FileText> = {
  report_single: FileText,
  report_pack3: Layers,
  sub_monthly: Repeat,
};

function PricingPage() {
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? getToken() : null;

  const { data, isPending } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: ent } = useQuery({
    queryKey: ["entitlement"],
    queryFn: getEntitlement,
    enabled: !!token,
  });
  const entitlement = ent?.entitlement;

  async function buy(productId: string) {
    if (!token) {
      toast.message("צריך להתחבר כדי לרכוש");
      navigate({ to: "/post-signup" });
      return;
    }
    setPendingId(productId);
    try {
      const { checkoutUrl } = await createCheckout(productId);
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בפתיחת התשלום");
      setPendingId(null);
    }
  }

  const products = data?.products ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 topo-lines">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs tracking-widest text-primary uppercase">תוכניות</p>
        <h1 className="text-3xl font-black sm:text-4xl">בחרו איך להמשיך</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-dust">
          ההתאמה הבסיסית והפרופיל תמיד חינם. הדוח האישי המלא — בתשלום חד-פעמי, בלי מנוי מתגלגל.
        </p>
        {data?.testMode ? (
          <p className="mx-auto mt-3 inline-block rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-500">
            מצב בדיקה — לא מחויב כסף אמיתי
          </p>
        ) : null}
      </div>

      {entitlement?.canGenerateReport ? (
        <div className="mx-auto mb-8 max-w-2xl rounded-sm border border-primary/30 bg-primary/5 p-4 text-center text-sm">
          <ShieldCheck className="ml-1 inline h-4 w-4 text-primary" aria-hidden />
          {entitlement.planActive
            ? "יש לכם מנוי פעיל — דוחות ללא הגבלה."
            : `יש לכם ${entitlement.reportCredits.toLocaleString("he-IL")} דוחות זמינים.`}{" "}
          <button
            type="button"
            onClick={() => navigate({ to: "/report" })}
            className="font-bold text-primary underline-offset-2 hover:underline"
          >
            ליצירת דוח
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Free tier — informational */}
        <PlanCard
          icon={Check}
          name="חינם"
          price="₪0"
          tagline="להכיר ולהתחיל"
          features={["פרופיל: דפ״ר, רפואי, מא״ה", "ספירה לאחור לגיוס", "התאמת תפקידים בסיסית (7)"]}
          cta={
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full rounded-md border border-iron/40 px-4 py-2.5 text-sm font-bold text-dust transition hover:text-foreground"
            >
              לדשבורד
            </button>
          }
        />

        {isPending
          ? Array.from({ length: 2 }).map((_, i) => <PlanCardSkeleton key={i} />)
          : products.map((p) => (
              <PlanCard
                key={p.id}
                icon={PRODUCT_ICON[p.id] ?? FileText}
                name={p.nameHe}
                price={`₪${p.priceIls.toLocaleString("he-IL")}`}
                priceSuffix={p.type === "subscription" ? "/ חודש" : "חד-פעמי"}
                tagline={p.descHe}
                featured={p.id === "report_single"}
                badge={p.id === "report_single" ? "הכי משתלם" : undefined}
                features={featuresFor(p)}
                cta={
                  <button
                    type="button"
                    onClick={() => buy(p.id)}
                    disabled={pendingId === p.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {pendingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    {p.type === "subscription" ? "התחילו מנוי" : "רכישה"}
                  </button>
                }
              />
            ))}
      </div>

      <p className="mt-8 text-center text-xs text-dust/60">
        השוואה: ייעוץ גיוס אנושי ≈ ₪500–3,000 לילד. תשלום מאובטח בשקלים, כולל חשבונית.
      </p>
    </div>
  );
}

function featuresFor(p: Product): string[] {
  if (p.type === "subscription") {
    return ["דוחות מלאים ללא הגבלה", "הפקה מחדש עם עדכון ציונים", "יועץ AI ומזכיר AI ללא הגבלה"];
  }
  const count = p.grant.reportCredits ?? 1;
  return [
    count > 1 ? `${count} דוחות מלאים` : "דוח AI מקיף (10 תפקידים)",
    "טיפים למיון, ראיון וגיבוש",
    "חוזקות, חולשות וסיכום להורים",
    "ייצוא PDF",
  ];
}

function PlanCard({
  icon: Icon,
  name,
  price,
  priceSuffix,
  tagline,
  features,
  cta,
  featured = false,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: React.ReactNode;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-card p-6 ${
        featured ? "border-primary/60 ring-1 ring-primary/30" : "border-iron/30"
      }`}
    >
      {badge ? (
        <span className="absolute -top-3 right-5 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
          {badge}
        </span>
      ) : null}
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
        <span className="text-base font-bold text-foreground">{name}</span>
      </div>
      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-foreground">{price}</span>
        {priceSuffix ? <span className="text-xs text-dust">{priceSuffix}</span> : null}
      </div>
      <p className="mb-5 min-h-[2.5rem] text-xs leading-relaxed text-dust">{tagline}</p>
      <ul className="mb-6 flex-1 space-y-2 text-sm text-dust">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta}
    </div>
  );
}

function PlanCardSkeleton() {
  return <div className="h-80 animate-pulse rounded-lg border border-iron/20 bg-card/50" />;
}
