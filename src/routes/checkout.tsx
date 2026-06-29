import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, FlaskConical } from "lucide-react";
import { getEntitlement, mockConfirmPayment } from "@/lib/api";
import { getToken } from "@/lib/auth";

type CheckoutSearch = {
  orderId?: string;
  provider?: string;
  canceled?: boolean;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
    provider: typeof search.provider === "string" ? search.provider : undefined,
    canceled: search.canceled === "1" || search.canceled === true,
  }),
  component: CheckoutPage,
});

type Status = "idle" | "confirming" | "success" | "error" | "canceled";

function CheckoutPage() {
  const { orderId, provider, canceled } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(canceled ? "canceled" : "idle");

  function refreshEntitlement() {
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["entitlement"] });
  }

  // Real processors grant via webhook (async). Poll entitlement a few times on return.
  useEffect(() => {
    if (canceled || provider === "mock" || !orderId) return;
    if (!getToken()) return;
    let cancelled = false;
    let tries = 0;
    setStatus("confirming");
    const tick = async () => {
      tries += 1;
      try {
        const { entitlement } = await getEntitlement();
        if (cancelled) return;
        if (entitlement.canGenerateReport) {
          refreshEntitlement();
          setStatus("success");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!cancelled && tries < 6) setTimeout(tick, 1500);
      else if (!cancelled) setStatus("error");
    };
    void tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, provider, canceled]);

  async function confirmMock() {
    if (!orderId) return;
    setStatus("confirming");
    try {
      await mockConfirmPayment(orderId);
      refreshEntitlement();
      setStatus("success");
      toast.success("התשלום אושר (מצב בדיקה)");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "אישור התשלום נכשל");
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center topo-lines">
      <div className="w-full rounded-lg border border-iron/30 bg-card p-8">
        {status === "success" ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden />
            <h1 className="text-xl font-black">התשלום הושלם</h1>
            <p className="mt-2 text-sm text-dust">הדוח המלא פתוח עכשיו. אפשר ליצור אותו מתי שתרצו.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/report" })}
              className="mt-6 w-full rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              ליצירת הדוח
            </button>
          </>
        ) : status === "canceled" ? (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-dust" aria-hidden />
            <h1 className="text-xl font-black">התשלום בוטל</h1>
            <p className="mt-2 text-sm text-dust">לא בוצע חיוב. אפשר לחזור ולנסות שוב.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/pricing" })}
              className="mt-6 w-full rounded-md border border-iron/40 px-5 py-2.5 text-sm font-bold text-dust transition hover:text-foreground"
            >
              חזרה לתוכניות
            </button>
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" aria-hidden />
            <h1 className="text-xl font-black">לא הצלחנו לאמת את התשלום</h1>
            <p className="mt-2 text-sm text-dust">אם חויבתם, האישור עשוי להתעדכן בדקות הקרובות.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/pricing" })}
              className="mt-6 w-full rounded-md border border-iron/40 px-5 py-2.5 text-sm font-bold text-dust transition hover:text-foreground"
            >
              חזרה לתוכניות
            </button>
          </>
        ) : provider === "mock" ? (
          <>
            <FlaskConical className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden />
            <h1 className="text-xl font-black">מצב בדיקה</h1>
            <p className="mt-2 text-sm text-dust">
              אין מעבד תשלומים אמיתי מחובר עדיין. לחצו כדי לדמות תשלום מוצלח ולפתוח את הדוח.
            </p>
            <button
              type="button"
              onClick={confirmMock}
              disabled={status === "confirming"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {status === "confirming" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              דמו תשלום מוצלח
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" aria-hidden />
            <h1 className="text-xl font-black">מאמתים את התשלום…</h1>
            <p className="mt-2 text-sm text-dust">רגע אחד.</p>
          </>
        )}
      </div>
    </div>
  );
}
