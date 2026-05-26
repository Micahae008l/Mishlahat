import { queryOptions } from "@tanstack/react-query";
import {
  getAdminMe,
  getAdminOverview,
  getAdminUsers,
  getDashboardStats,
  getReportHistory,
  getSession,
  listReportHistory,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const MIN = 60_000;

export const STALE = {
  session: 10 * MIN,
  dashboard: 5 * MIN,
  reportHistory: 3 * MIN,
  reportDetail: 10 * MIN,
  admin: 2 * MIN,
} as const;

export const sessionQueryOptions = (tokenPresent: boolean) =>
  queryOptions({
    queryKey: queryKeys.session(tokenPresent),
    queryFn: getSession,
    enabled: tokenPresent,
    staleTime: STALE.session,
  });

export const dashboardQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: queryKeys.dashboard(token),
    queryFn: getDashboardStats,
    enabled: !!token,
    staleTime: STALE.dashboard,
  });

export const reportHistoryQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: queryKeys.reportHistory(token),
    queryFn: listReportHistory,
    enabled: !!token,
    staleTime: STALE.reportHistory,
  });

export const reportHistoryDetailQueryOptions = (reportId: string, token: string | null) =>
  queryOptions({
    queryKey: queryKeys.reportHistoryDetail(reportId, token),
    queryFn: () => getReportHistory(reportId),
    enabled: !!token && !!reportId,
    staleTime: STALE.reportDetail,
  });

export const adminMeQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: queryKeys.adminMe(token),
    queryFn: getAdminMe,
    enabled: !!token,
    staleTime: STALE.admin,
  });

export const adminOverviewQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: queryKeys.adminOverview(token),
    queryFn: getAdminOverview,
    enabled: !!token,
    staleTime: STALE.admin,
  });

export const adminUsersQueryOptions = (token: string | null, search: string) =>
  queryOptions({
    queryKey: queryKeys.adminUsers(token, search),
    queryFn: () => getAdminUsers({ q: search || undefined, limit: 50 }),
    enabled: !!token,
    staleTime: STALE.admin,
  });

/** Warm caches after login and on navigation (no-op if data is still fresh). */
export function prefetchAuthedData(
  queryClient: import("@tanstack/react-query").QueryClient,
  token: string | null,
) {
  if (!token) return;
  void queryClient.prefetchQuery(sessionQueryOptions(true));
  void queryClient.prefetchQuery(dashboardQueryOptions(token));
  void queryClient.prefetchQuery(reportHistoryQueryOptions(token));
}
