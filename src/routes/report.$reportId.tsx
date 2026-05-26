import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReportResultView } from "@/components/ReportResultView";
import { downloadReportPdf, type FullReportResponse } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { reportHistoryDetailQueryOptions } from "@/lib/queries";
import { openReportPrintWindow } from "@/lib/reportPrintHtml";
import { ReportResultSkeleton } from "@/components/skeletons/PageSkeletons";

export const Route = createFileRoute("/report/$reportId")({
  component: SavedReportPage,
});

function SavedReportPage() {
  const { reportId } = Route.useParams();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !getToken()) {
      navigate({ to: "/post-signup" });
    }
  }, [mounted, navigate]);

  const token = mounted ? getToken() : null;
  const { data, isPending, isError, error } = useQuery({
    ...reportHistoryDetailQueryOptions(reportId, token),
    retry: 1,
  });
  const showSkeleton = (isPending && !data) || !mounted || !token;

  const result: FullReportResponse | null = data
    ? {
        report: data.report,
        userName: data.userName,
        generatedAt: data.generatedAt,
        historyId: data.id,
      }
    : null;

  function handlePrintPdf() {
    if (!result) return;
    try {
      openReportPrintWindow(result.report, result.userName);
      toast.success("נפתח חלון הדפסה");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    }
  }

  async function handleServerPdfDownload() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await downloadReportPdf(result.report, result.userName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kachkivun-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בהורדת PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  if (showSkeleton) {
    return <ReportResultSkeleton />;
  }

  if (isError || !result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-destructive">{error instanceof Error ? error.message : "הדוח לא נמצא"}</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/report" })}
          className="mt-4 text-sm text-primary hover:underline"
        >
          חזרה לדוח חדש
        </button>
      </div>
    );
  }

  return (
    <ReportResultView
      data={result}
      onPrint={handlePrintPdf}
      onServerDownload={handleServerPdfDownload}
      pdfLoading={pdfLoading}
    />
  );
}
