import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Sparkles,
  DollarSign,
  Search,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminSkeleton, AdminUsersTableSkeleton } from "@/components/skeletons/PageSkeletons";
import { ApiError, deleteAdminUser, updateAdminUserRole, type AdminUserRow } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  adminMeQueryOptions,
  adminOverviewQueryOptions,
  adminUsersQueryOptions,
  sessionQueryOptions,
} from "@/lib/queries";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatTokens(n: number) {
  return new Intl.NumberFormat("he-IL").format(n);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("he-IL");
}

function statusHebrew(status: string) {
  if (status === "Active Duty") return "בשירות";
  if (status === "Discharged") return "אחרי שירות";
  return "לפני גיוס";
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const token = mounted ? getToken() : null;

  useEffect(() => {
    if (mounted && !token) {
      navigate({ to: "/post-signup" });
    }
  }, [mounted, token, navigate]);

  const session = useQuery({
    ...sessionQueryOptions(!!token),
    enabled: mounted && !!token,
    retry: 1,
  });

  const adminMe = useQuery({
    ...adminMeQueryOptions(token),
    enabled: mounted && !!token && session.data?.role === "admin",
    retry: false,
  });

  useEffect(() => {
    if (session.isSuccess && session.data.role !== "admin") {
      toast.error("אין הרשאת מנהל. התחברו עם mike.haddad.08@gmail.com");
      navigate({ to: "/dashboard" });
    }
  }, [session.isSuccess, session.data?.role, navigate]);

  useEffect(() => {
    if (adminMe.isError && adminMe.error instanceof ApiError && adminMe.error.status === 403) {
      toast.error("אין הרשאת מנהל");
      navigate({ to: "/dashboard" });
    }
  }, [adminMe.isError, adminMe.error, navigate]);

  const overview = useQuery({
    ...adminOverviewQueryOptions(token),
    enabled: mounted && !!token && adminMe.isSuccess,
  });

  const usersQuery = useQuery({
    ...adminUsersQueryOptions(token, debouncedQ),
    enabled: mounted && !!token && adminMe.isSuccess,
  });
  const usersLoading = usersQuery.isPending && !usersQuery.data;

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) =>
      updateAdminUserRole(id, role),
    onSuccess: () => {
      toast.success("תפקיד עודכן");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success("משתמש נמחק");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const me = adminMe.data;
  const ov = overview.data;

  const busy =
    (session.isPending && !session.data) ||
    (session.data?.role === "admin" &&
      ((adminMe.isPending && !adminMe.data) || (adminMe.isSuccess && overview.isPending && !overview.data)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 topo-lines">
      {!mounted || !token ? (
        <p className="text-center text-dust">מעבירים להתחברות…</p>
      ) : session.isError ? (
        <div className="mx-auto max-w-md border border-iron/30 bg-card p-8 text-center">
          <p className="text-destructive">
            {session.error instanceof Error ? session.error.message : "שגיאה"}
          </p>
        </div>
      ) : session.data?.role !== "admin" ? (
        <p className="text-center text-dust">מעבירים לדשבורד…</p>
      ) : busy ? (
        <AdminSkeleton />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
          <motion.div
            variants={fadeUp}
            className="flex flex-col-reverse gap-4 border-b border-iron/30 pb-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="text-right">
              <p className="mb-2 font-mono text-xs tracking-widest text-dust uppercase">ניהול מערכת</p>
              <h1 className="text-2xl font-black sm:text-4xl">פאנל מנהל</h1>
              <p className="mt-2 text-sm text-dust">
                {me?.preferredName?.trim() || me?.email} · גישה מלאה למשתמשים ועלויות AI
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  void overview.refetch();
                  void usersQuery.refetch();
                }}
                className="inline-flex items-center gap-2 rounded-md border border-iron/40 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                רענון
              </button>
              <Link
                to="/dashboard"
                className="rounded-md border border-iron/40 bg-card px-3 py-1.5 text-xs font-medium text-dust transition hover:text-foreground"
              >
                חזרה לדשבורד
              </Link>
            </div>
          </motion.div>

          {overview.isError ? (
            <div className="border border-destructive/40 bg-card p-6 text-center text-destructive">
              {overview.error instanceof Error ? overview.error.message : "שגיאה"}
            </div>
          ) : ov ? (
            <>
              <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={Users}
                  label="משתמשים"
                  value={String(ov.users.total)}
                  hint={`${ov.users.admins} מנהלים`}
                />
                <MetricCard
                  icon={Sparkles}
                  label="קריאות AI"
                  value={String(ov.openai.totalCalls)}
                  hint={`${ov.openai.successCalls} הצליחו`}
                />
                <MetricCard
                  icon={DollarSign}
                  label="עלות משוערת"
                  value={formatUsd(ov.openai.estimatedCostUsd)}
                  hint="סה״כ כל המשתמשים"
                />
                <MetricCard
                  icon={Shield}
                  label="טוקנים"
                  value={formatTokens(ov.openai.totalTokens)}
                  hint={`קלט ${formatTokens(ov.openai.promptTokens)} · פלט ${formatTokens(ov.openai.completionTokens)}`}
                />
              </motion.div>

              <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5 sm:p-6">
                <p className="mb-4 font-mono text-xs tracking-widest text-dust uppercase">
                  פעילות AI אחרונה
                </p>
                {ov.recentUsage.length === 0 ? (
                  <p className="text-sm text-dust">אין רישומי שימוש עדיין. עלויות יופיעו אחרי קריאות ליועץ AI.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[32rem] text-right text-sm">
                      <thead>
                        <tr className="border-b border-iron/20 text-xs text-dust">
                          <th className="py-2 pl-4 font-medium">אימייל</th>
                          <th className="py-2 pl-4 font-medium">מודל</th>
                          <th className="py-2 pl-4 font-medium">טוקנים</th>
                          <th className="py-2 pl-4 font-medium">עלות</th>
                          <th className="py-2 font-medium">סטטוס</th>
                          <th className="py-2 font-medium">תאריך</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ov.recentUsage.map((row, i) => (
                          <tr key={`${row.createdAt}-${i}`} className="border-b border-iron/10">
                            <td className="py-2.5 pl-4 font-mono text-xs">{row.userEmail || "—"}</td>
                            <td className="py-2.5 pl-4 text-dust">{row.model || "—"}</td>
                            <td className="py-2.5 pl-4 font-mono tabular-nums">{row.totalTokens}</td>
                            <td className="py-2.5 pl-4 font-mono tabular-nums">
                              {formatUsd(Number(row.estimatedCostUsd) || 0)}
                            </td>
                            <td className="py-2.5 pl-4 text-dust">{row.status}</td>
                            <td className="py-2.5 text-dust">{formatDate(row.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-[11px] text-dust/70">{ov.openai.pricing.note}</p>
              </motion.div>
            </>
          ) : null}

          <motion.div variants={fadeUp} className="border border-iron/30 bg-card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-xs tracking-widest text-dust uppercase">ניהול משתמשים</p>
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dust" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לפי אימייל או שם…"
                  className="w-full rounded-md border border-iron/30 bg-background py-2 pr-10 pl-3 text-sm text-foreground outline-none transition focus:border-primary/50"
                />
              </div>
            </div>

            {usersLoading ? (
              <AdminUsersTableSkeleton />
            ) : usersQuery.isError ? (
              <p className="text-sm text-destructive">
                {usersQuery.error instanceof Error ? usersQuery.error.message : "שגיאה"}
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs text-dust">
                  {usersQuery.data?.total ?? 0} משתמשים
                  {debouncedQ ? ` · חיפוש: "${debouncedQ}"` : ""}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-right text-sm">
                    <thead>
                      <tr className="border-b border-iron/20 text-xs text-dust">
                        <th className="py-2 pl-3 font-medium">אימייל</th>
                        <th className="py-2 pl-3 font-medium">שם</th>
                        <th className="py-2 pl-3 font-medium">סטטוס</th>
                        <th className="py-2 pl-3 font-medium">תפקיד</th>
                        <th className="py-2 pl-3 font-medium">AI</th>
                        <th className="py-2 pl-3 font-medium">עלות</th>
                        <th className="py-2 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersQuery.data?.users ?? []).map((u) => (
                        <UserRow
                          key={u.id}
                          user={u}
                          currentAdminId={me?.userId}
                          onRole={(role) => roleMutation.mutate({ id: u.id, role })}
                          onDelete={() => setDeleteTarget(u)}
                          rolePending={roleMutation.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-iron/40 bg-card p-6 text-right shadow-lg">
            <div className="mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h2 className="text-lg font-bold">מחיקת משתמש</h2>
            </div>
            <p className="text-sm text-dust">
              למחוק לצמיתות את <span className="font-mono text-foreground">{deleteTarget.email}</span>?
              יימחקו גם הפרופיל, ההעדפות ורישומי השימוש ב-AI.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-iron/40 px-4 py-2 text-sm text-dust transition hover:text-foreground"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border border-iron/30 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-dust uppercase">{label}</span>
        <Icon className="h-4 w-4 text-primary/80" />
      </div>
      <p className="font-mono text-2xl font-black tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-dust">{hint}</p>
    </div>
  );
}

function UserRow({
  user,
  currentAdminId,
  onRole,
  onDelete,
  rolePending,
}: {
  user: AdminUserRow;
  currentAdminId?: string;
  onRole: (role: "user" | "admin") => void;
  onDelete: () => void;
  rolePending: boolean;
}) {
  const isSelf = currentAdminId === user.id;

  return (
    <tr className="border-b border-iron/10">
      <td className="py-3 pl-3 font-mono text-xs">{user.email}</td>
      <td className="py-3 pl-3">{user.preferredName || "—"}</td>
      <td className="py-3 pl-3 text-dust">{statusHebrew(user.status)}</td>
      <td className="py-3 pl-3">
        <span
          className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
            user.role === "admin" ? "bg-primary/20 text-primary" : "bg-iron/20 text-dust"
          }`}
        >
          {user.role === "admin" ? "מנהל" : "משתמש"}
        </span>
      </td>
      <td className="py-3 pl-3 text-dust">
        {user.aiReady ? (
          <span className="text-olive">מוכן</span>
        ) : (
          <span>חסר פרופיל</span>
        )}
        <span className="mr-2 font-mono text-[10px] tabular-nums">({user.aiUsage.callCount})</span>
      </td>
      <td className="py-3 pl-3 font-mono text-xs tabular-nums">
        {formatUsd(user.aiUsage.estimatedCostUsd)}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {user.role === "admin" ? (
            <button
              type="button"
              disabled={rolePending || isSelf}
              onClick={() => onRole("user")}
              className="rounded border border-iron/30 px-2 py-1 text-[11px] text-dust transition hover:text-foreground disabled:opacity-40"
              title={isSelf ? "לא ניתן להוריד את עצמך" : undefined}
            >
              הורד למשתמש
            </button>
          ) : (
            <button
              type="button"
              disabled={rolePending}
              onClick={() => onRole("admin")}
              className="rounded border border-primary/30 px-2 py-1 text-[11px] text-primary transition hover:bg-primary/10 disabled:opacity-40"
            >
              הפוך למנהל
            </button>
          )}
          <button
            type="button"
            disabled={isSelf}
            onClick={onDelete}
            className="rounded border border-destructive/30 p-1 text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
            title={isSelf ? "לא ניתן למחוק את עצמך" : "מחק משתמש"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
