import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMatchHistory,
  getMatchHistory,
  type MatchConfidence,
  type MatchHistoryDetail,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-errors";
import { matchHistoryQueryOptions } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { getToken } from "@/lib/auth";

const CONFIDENCE_LABEL: Record<MatchConfidence, string> = {
  high: "ביטחון גבוה",
  medium: "ביטחון בינוני",
  low: "ביטחון נמוך",
};

export function MatchHistoryPanel({
  onLoad,
  activeId,
}: {
  onLoad: (detail: MatchHistoryDetail) => void;
  activeId?: string | null;
}) {
  const queryClient = useQueryClient();
  const token = getToken();
  const { data, isPending } = useQuery(matchHistoryQueryOptions(token));
  const [busyId, setBusyId] = useState<string | null>(null);

  const matches = data?.matches ?? [];
  if (isPending || matches.length === 0) return null;

  async function loadMatch(id: string) {
    setBusyId(id);
    try {
      const detail = await getMatchHistory(id);
      onLoad(detail);
    } catch (e) {
      toast.error(getErrorMessage(e, "שגיאה בטעינת התאמה קודמת"));
    } finally {
      setBusyId(null);
    }
  }

  async function removeMatch(id: string) {
    setBusyId(id);
    try {
      await deleteMatchHistory(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory(token) });
      toast.success("ההתאמה נמחקה");
    } catch (e) {
      toast.error(getErrorMessage(e, "שגיאה במחיקה"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="border border-iron/30 bg-card" aria-labelledby="match-history-heading">
      <div className="flex items-center justify-between gap-2 border-b border-iron/20 px-5 py-2.5">
        <span className="font-mono text-[10px] text-dust/60">{matches.length} ריצות אחרונות</span>
        <h2 id="match-history-heading" className="eyebrow flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" aria-hidden />
          התאמות קודמות
        </h2>
      </div>
      <ul className="divide-y divide-iron/15">
        {matches.map((m) => {
          const isActive = m.id === activeId;
          return (
            <li
              key={m.id}
              className={`flex flex-row-reverse items-center gap-3 px-5 py-3 text-right ${
                isActive ? "bg-primary/5" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.topRole || "התאמת תפקידים"}
                  {m.topMatch != null ? (
                    <span className="mr-2 font-mono text-xs text-primary">{m.topMatch}%</span>
                  ) : null}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-dust/70">
                  {new Date(m.createdAt).toLocaleDateString("he-IL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {CONFIDENCE_LABEL[m.confidence] ?? ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadMatch(m.id)}
                  disabled={busyId === m.id || isActive}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron/30 text-dust transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
                  aria-label="הצגת ההתאמה"
                  title="הצגת ההתאמה"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeMatch(m.id)}
                  disabled={busyId === m.id}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-iron/30 text-dust transition hover:border-destructive/50 hover:text-destructive disabled:opacity-40"
                  aria-label="מחיקת ההתאמה"
                  title="מחיקת ההתאמה"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
