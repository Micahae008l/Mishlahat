import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, ThumbsUp, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  createReview,
  getReviewsByRole,
  type CreateReviewPayload,
  type RoleReviewDto,
  type RoleReviewStats,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api-errors";

const ease = [0.16, 1, 0.3, 1] as const;

export function RoleReviewStats({ stats }: { stats: RoleReviewStats | null }) {
  if (!stats || stats.count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-dust/80">
      <span className="flex items-center gap-1">
        <Star className="h-3 w-3 text-primary" aria-hidden />
        {stats.avgRating}/5
      </span>
      <span>קושי: {stats.avgDifficulty}/5</span>
      <span>{stats.recommendPct}% ממליצים</span>
      <span className="text-dust/50">({stats.count} ביקורות)</span>
    </div>
  );
}

export function RoleReviewPanel({
  roleSlug,
  roleTitle,
}: {
  roleSlug: string;
  roleTitle: string;
}) {
  const [reviews, setReviews] = useState<RoleReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReviewsByRole(roleSlug)
      .then((data) => {
        if (!cancelled) setReviews(data.reviews);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roleSlug]);

  function handleNewReview(review: RoleReviewDto) {
    setReviews((prev) => [review, ...prev.filter((r) => r._id !== review._id)]);
    setShowForm(false);
  }

  const isLoggedIn = !!getToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
          ביקורות ({reviews.length})
        </h3>
        {isLoggedIn && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            כתבו ביקורת
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease }}
          >
            <ReviewForm
              roleSlug={roleSlug}
              roleTitle={roleTitle}
              onSubmitted={handleNewReview}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-xs text-dust/60">טוען ביקורות…</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-dust/60">
          עדיין אין ביקורות לתפקיד הזה.{" "}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-primary hover:underline"
            >
              היו הראשונים
            </button>
          ) : (
            "התחברו כדי לכתוב ביקורת."
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 5).map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
          {reviews.length > 5 && (
            <p className="text-xs text-dust/50">ו-{reviews.length - 5} ביקורות נוספות…</p>
          )}
        </div>
      )}

      {!isLoggedIn && reviews.length > 0 && (
        <p className="text-xs text-dust/60">
          <AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden />
          התחברו כדי לכתוב ביקורת משלכם.
        </p>
      )}
    </div>
  );
}

function ReviewForm({
  roleSlug,
  roleTitle,
  onSubmitted,
  onCancel,
}: {
  roleSlug: string;
  roleTitle: string;
  onSubmitted: (r: RoleReviewDto) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [tip, setTip] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (rating === 0) { toast.error("נא לבחור דירוג"); return; }
    if (difficulty === 0) { toast.error("נא לבחור רמת קושי"); return; }
    if (wouldRecommend === null) { toast.error("נא לבחור אם ממליצים"); return; }

    setSaving(true);
    try {
      const payload: CreateReviewPayload = {
        roleSlug,
        roleTitle,
        rating,
        difficulty,
        wouldRecommend,
        pros: pros.trim(),
        cons: cons.trim(),
        tip: tip.trim(),
      };
      const { review } = await createReview(payload);
      toast.success("הביקורת נשמרה");
      onSubmitted(review);
    } catch (e) {
      toast.error(getErrorMessage(e, "שגיאה בשמירת ביקורת"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 border border-iron/20 bg-secondary/20 p-4">
      <p className="text-xs font-medium text-dust">ביקורת על: {roleTitle}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs text-dust">דירוג כללי</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <p className="mb-2 text-xs text-dust">רמת קושי</p>
          <StarPicker value={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-dust">ממליצים?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
              wouldRecommend === true
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-iron/30 text-dust hover:text-foreground"
            }`}
          >
            <ThumbsUp className="h-3 w-3" aria-hidden />
            כן
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition ${
              wouldRecommend === false
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-iron/30 text-dust hover:text-foreground"
            }`}
          >
            לא
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-dust mb-1">יתרונות (אופציונלי)</label>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            maxLength={500}
            rows={2}
            className="input-field w-full resize-none text-xs"
            placeholder="מה היה טוב?"
          />
        </div>
        <div>
          <label className="block text-xs text-dust mb-1">חסרונות (אופציונלי)</label>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            maxLength={500}
            rows={2}
            className="input-field w-full resize-none text-xs"
            placeholder="מה היה פחות טוב?"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-dust mb-1">טיפ למתגייסים (אופציונלי)</label>
        <input
          type="text"
          value={tip}
          onChange={(e) => setTip(e.target.value)}
          maxLength={300}
          className="input-field w-full text-xs"
          placeholder="שורה אחת — מה הייתם רוצים לדעת לפני"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-iron/20 pt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary px-5 py-2 text-xs disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          {saving ? "שומר…" : "שליחה"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-dust hover:text-foreground"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition"
          aria-label={`${n} כוכבים`}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-primary text-primary" : "text-iron/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: RoleReviewDto }) {
  const date = new Date(review.createdAt).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="border border-iron/15 bg-card p-3 text-right">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3 w-3 ${n <= review.rating ? "fill-primary text-primary" : "text-iron/30"}`}
              />
            ))}
          </div>
          {review.wouldRecommend && (
            <span className="flex items-center gap-0.5 text-[10px] text-primary">
              <ThumbsUp className="h-2.5 w-2.5" aria-hidden />
              ממליץ
            </span>
          )}
        </div>
        <span className="text-[10px] text-dust/50">{date}</span>
      </div>
      {review.pros && (
        <p className="mt-2 text-xs leading-relaxed text-dust">
          <strong className="text-foreground/80">+</strong> {review.pros}
        </p>
      )}
      {review.cons && (
        <p className="mt-1 text-xs leading-relaxed text-dust">
          <strong className="text-foreground/80">−</strong> {review.cons}
        </p>
      )}
      {review.tip && (
        <p className="mt-1 rounded-sm bg-primary/5 px-2 py-1 text-[11px] text-primary/80">
          💡 {review.tip}
        </p>
      )}
    </div>
  );
}
