import { Skeleton, SkeletonShell } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <SkeletonShell label="טוען דשבורד" className="space-y-8" dir="rtl">
      <Skeleton className="aspect-[24/7] w-full sm:aspect-[32/7]" />
      <div className="flex flex-col-reverse gap-3 border-b border-iron/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 text-right">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 self-end rounded-md" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-iron/30 bg-card p-6 sm:p-8 space-y-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-14 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3.5 w-full" />
        </div>
        <div className="border border-iron/30 bg-card divide-y divide-iron/20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-5 sm:p-7">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="border border-iron/30 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full max-w-xs" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-24 w-full border border-iron/30" />
    </SkeletonShell>
  );
}

export function OnboardingSkeleton() {
  return (
    <SkeletonShell
      label="טוען פרופיל"
      className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-16"
      dir="rtl"
    >
      <Skeleton className="hidden h-24 w-full lg:block" />
      <div className="border border-iron/30 bg-card p-6 sm:p-10 space-y-6">
        <div className="space-y-2 text-right">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function PostSignupBootstrapSkeleton() {
  return (
    <SkeletonShell
      label="טוען פרופיל"
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6"
      dir="rtl"
    >
      <div className="flex w-full max-w-2xl items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="w-full max-w-2xl border border-iron/30 bg-card p-8 space-y-5">
        <Skeleton className="mx-auto h-10 w-10" />
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-4 w-64 max-w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full max-w-xs mx-auto rounded-md" />
      </div>
    </SkeletonShell>
  );
}

export function ReportResultSkeleton() {
  return (
    <SkeletonShell
      label="טוען דוח"
      className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 topo-lines"
      dir="rtl"
    >
      <div className="flex flex-col-reverse gap-4 border-b border-iron/30 pb-6 sm:flex-row sm:justify-between">
        <div className="space-y-3 text-right flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-5/6 max-w-md" />
        </div>
        <div className="flex flex-col gap-2 self-end">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="border border-iron/30 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <div className="border border-iron/30 bg-card p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 border border-iron/20 p-4">
            <Skeleton className="h-16 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonShell>
  );
}

export function ReportGeneratingSkeleton() {
  return (
    <SkeletonShell
      label="מייצרים את הדוח האישי"
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col gap-8 px-4 py-12"
      dir="rtl"
    >
      <div className="space-y-3 text-right">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="border border-iron/30 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="border border-iron/30 bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-36" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </SkeletonShell>
  );
}

export function AdminSkeleton() {
  return (
    <SkeletonShell label="טוען פאנל ניהול" className="space-y-8" dir="rtl">
      <div className="border-b border-iron/30 pb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-iron/30 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="border border-iron/30 bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="border border-iron/30 bg-card p-5 space-y-3">
        <Skeleton className="h-10 w-full max-w-md" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </SkeletonShell>
  );
}

export function AdminUsersTableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-32" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function RoleMatchCardsSkeleton() {
  return (
    <div className="space-y-5" aria-hidden dir="rtl">
      <div className="flex justify-end gap-3">
        <div className="space-y-2 text-right flex-1">
          <Skeleton className="h-3 w-16 mr-auto" />
          <Skeleton className="h-7 w-56 mr-auto max-w-full" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0" />
      </div>
      <div className="border border-iron/30 bg-card overflow-hidden">
        <div className="grid md:grid-cols-[1fr_220px]">
          <div className="space-y-4 p-6">
            <div className="flex gap-4">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-7 w-16" />
              ))}
            </div>
          </div>
          <Skeleton className="min-h-[140px] w-full md:order-2" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-iron/30 bg-card overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3" aria-hidden>
      <Skeleton className="h-7 w-7 shrink-0" />
      <div className="max-w-[85%] flex-1 space-y-2 border border-iron/20 bg-secondary px-4 py-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function PostSignupFormSkeleton() {
  return (
    <div className="w-full max-w-2xl border border-iron/30 bg-background/90 p-8 space-y-5" aria-hidden>
      <Skeleton className="mx-auto h-10 w-10" />
      <Skeleton className="mx-auto h-7 w-48" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
}
