import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ChevronLeft, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { deleteReportHistory } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { reportHistoryQueryOptions } from "@/lib/queries";
import { ARIA } from "@/lib/a11y";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ReportHistoryPanel() {
  const token = getToken();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery(reportHistoryQueryOptions(token));
  const loading = isPending && !data;

  const deleteMutation = useMutation({
    mutationFn: deleteReportHistory,
    onSuccess: () => {
      toast.success("נמחק מההיסטוריה");
      void queryClient.invalidateQueries({ queryKey: ["report-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reports = data?.reports ?? [];
  if (!token || loading || isError || reports.length === 0) {
    return null;
  }

  return (
    <section className="border border-iron/30 bg-card p-4 sm:p-5" aria-labelledby="report-history-heading">
      <div className="mb-3 flex items-center gap-2 text-right">
        <History className="h-4 w-4 text-primary" aria-hidden />
        <h2 id="report-history-heading" className="font-mono text-xs tracking-widest text-dust uppercase">
          {ARIA.reportHistory}
        </h2>
      </div>
      <ul className="space-y-2">
        {reports.map((r) => {
          const reportTitle = r.direction || "דוח כיוון";
          return (
          <li
            key={r.id}
            className="flex items-center gap-2 border border-iron/20 bg-background/50 px-3 py-2.5 transition hover:border-primary/30"
          >
            <button
              type="button"
              onClick={() => deleteMutation.mutate(r.id)}
              disabled={deleteMutation.isPending}
              className="shrink-0 rounded p-1 text-dust transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label={ARIA.deleteReport(reportTitle)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
            <Link
              to="/report/$reportId"
              params={{ reportId: r.id }}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 text-right"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {r.direction || "דוח כיוון"}
                  {r.topMatch != null ? ` · ${r.topMatch}%` : ""}
                </p>
                <p className="truncate text-xs text-dust">
                  {r.topRole ? `${r.topRole} · ` : ""}
                  <Clock className="mb-0.5 ml-0.5 inline h-3 w-3" aria-hidden />
                  {formatWhen(r.createdAt)}
                </p>
              </div>
            </Link>
          </li>
        );
        })}
      </ul>
    </section>
  );
}
