import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { listRoleReviews, submitRoleReview } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import { trackReviewSubmit } from "@/lib/analytics";
import { getToken } from "@/lib/auth";

type Props = {
  roleSlug: string;
  roleTitle: string;
};

export function RoleReviewsPanel({ roleSlug, roleTitle }: Props) {
  const queryClient = useQueryClient();
  const authed = Boolean(getToken());
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [servedInRole, setServedInRole] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["role-reviews", roleSlug],
    queryFn: () => listRoleReviews(roleSlug),
    staleTime: 60_000,
  });

  const submit = useMutation({
    mutationFn: () =>
      submitRoleReview(roleSlug, {
        displayName: displayName.trim(),
        body: body.trim(),
        rating,
        servedInRole,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      trackReviewSubmit(roleSlug);
      setBody("");
      setRating(null);
      setServedInRole(false);
      void queryClient.invalidateQueries({ queryKey: ["role-reviews", roleSlug] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "שליחת הביקורת נכשלה")),
  });

  const reviews = reviewsQuery.data?.reviews ?? [];

  return (
    <section className="space-y-4 border-t border-iron/20 pt-5" aria-labelledby="role-reviews-heading">
      <div>
        <h3 id="role-reviews-heading" className="flex items-center justify-end gap-2 text-sm font-bold text-foreground">
          ביקורות משרתים
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
        </h3>
        <p className="mt-1 text-xs text-dust">
          שירתם ב«{roleTitle}»? שתפו חוויה קצרה. הביקורות לא מתפרסמות מיד, הן עוברות אישור צוות.
        </p>
      </div>

      {reviewsQuery.isLoading ? (
        <p className="text-xs text-dust">טוען ביקורות…</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-dust">עדיין אין ביקורות מאושרות לתפקיד הזה.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="border border-iron/25 bg-background/40 p-3 text-right">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-dust">
                  {new Date(r.createdAt).toLocaleDateString("he-IL")}
                </span>
                <div className="flex items-center gap-2">
                  {r.rating ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-primary">
                      <Star className="h-3 w-3 fill-current" aria-hidden />
                      {r.rating}/5
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold text-foreground">{r.displayName}</span>
                </div>
              </div>
              {r.servedInRole ? (
                <p className="mt-1 text-[10px] text-primary/90">שירת/ה בתפקיד</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-dust">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {authed ? (
        <form
          className="space-y-3 border border-iron/30 bg-background/30 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <p className="text-xs font-semibold text-foreground">השאירו ביקורת</p>
          <label className="block text-right text-xs text-dust">
            שם לתצוגה
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="input-field mt-1 w-full"
              placeholder="למשל: אורי"
              required
            />
          </label>
          <label className="block text-right text-xs text-dust">
            הביקורת
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1200}
              rows={4}
              className="input-field mt-1 w-full resize-y"
              placeholder="איך היה השירות? מה כדאי לדעת לפני שמגיעים?"
              required
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating((prev) => (prev === n ? null : n))}
                  className={`rounded p-1 transition ${
                    rating != null && rating >= n ? "text-primary" : "text-dust/50 hover:text-dust"
                  }`}
                  aria-label={`דירוג ${n}`}
                >
                  <Star className={`h-4 w-4 ${rating != null && rating >= n ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-dust">
              <input
                type="checkbox"
                checked={servedInRole}
                onChange={(e) => setServedInRole(e.target.checked)}
                className="accent-primary"
              />
              שירתתי בתפקיד הזה
            </label>
          </div>
          <button
            type="submit"
            disabled={submit.isPending || body.trim().length < 20}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            {submit.isPending ? "שולח…" : "שלחו לאישור"}
          </button>
          <p className="text-[10px] leading-relaxed text-dust/80">
            אחרי השליחה הביקורת ממתינה לאישור מנהל ולא תופיע מיד באתר.
          </p>
        </form>
      ) : (
        <p className="text-xs text-dust">
          כדי לכתוב ביקורת צריך{" "}
          <Link to="/post-signup" className="font-semibold text-primary hover:underline">
            להתחבר
          </Link>
          .
        </p>
      )}
    </section>
  );
}
