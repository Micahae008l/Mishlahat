import { QueryClient } from "@tanstack/react-query";
import { attachQueryPersistence } from "@/lib/query-persist";

const MIN = 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * MIN,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

if (typeof window !== "undefined") {
  attachQueryPersistence(queryClient);
}
