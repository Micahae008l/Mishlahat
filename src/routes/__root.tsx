import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import appCss from "../styles.css?url";
import { queryClient } from "@/lib/query-client";
import { clearToken, getToken } from "@/lib/auth";
import { MishlahatLogo, MISHLAHAT_LOGO_URL } from "@/components/MishlahatLogo";
import { SITE_NAME_HE } from "@/lib/brand";
import { IDF_BACKDROP_IMAGE_URLS, preloadIdfBackdropImages } from "@/lib/idf-images";

export const Route = createRootRoute({
  shellComponent: RootDocument,
  component: RootLayout,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_NAME_HE },
      { name: "description", content: `${SITE_NAME_HE} — פלטפורמת הכנה לשירות בצה״ל: פרופיל, מא״ה, והתאמת תפקידים עם AI` },
    ],
    links: [
      { rel: "icon", type: "image/png", href: MISHLAHAT_LOGO_URL },
      { rel: "apple-touch-icon", href: MISHLAHAT_LOGO_URL },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
      ...IDF_BACKDROP_IMAGE_URLS.map((href) => ({
        rel: "preload" as const,
        href,
        as: "image" as const,
      })),
    ],
  }),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh font-sans antialiased text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function RootLayoutInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBareShell = pathname === "/post-signup";
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  useEffect(() => {
    preloadIdfBackdropImages();
  }, []);

  function logout() {
    clearToken();
    setAuthed(false);
    navigate({ to: "/" });
  }

  return (
    <>
      {!isBareShell && <SiteHeader authed={authed} onLogout={logout} />}
      <main className="animate-fade-in">
        <Outlet />
      </main>
      {!isBareShell && (
        <footer className="border-t border-iron/30 mt-20">
          <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-4 px-4 py-6 text-xs text-dust/60 sm:flex-row sm:justify-between sm:px-6 sm:py-8">
            <span className="text-dust/50">&copy; {new Date().getFullYear()} {SITE_NAME_HE}</span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link to="/" className="transition hover:text-foreground">ראשי</Link>
              <Link to="/role-insights" className="transition hover:text-foreground">תובנות</Link>
              <span className="cursor-default">פרטיות</span>
              <span className="cursor-default">תנאי שימוש</span>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

const NAV_PUBLIC = [
  { to: "/", label: "בית", exact: true },
] as const;

const NAV_AUTHED = [
  { to: "/", label: "בית", exact: true },
  { to: "/dashboard", label: "דשבורד" },
  { to: "/ai-counselor", label: "יועץ AI" },
  { to: "/role-insights", label: "תובנות" },
] as const;

function SiteHeader({ authed, onLogout }: { authed: boolean; onLogout: () => void }) {
  const NAV_ITEMS = authed ? NAV_AUTHED : NAV_PUBLIC;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled || mobileOpen
          ? "border-b border-iron/30 bg-background/95 backdrop-blur-sm shadow-[0_1px_8px_oklch(0_0_0/0.4)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <MishlahatLogo size="sm" linked />

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          <nav className="flex items-center">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} exact={"exact" in item ? item.exact : undefined}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mr-3 flex items-center gap-2">
            {authed ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-md border border-iron/40 bg-card px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  דשבורד
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-medium text-dust transition hover:text-foreground"
                >
                  יציאה
                </button>
              </>
            ) : (
              <Link
                to="/post-signup"
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]"
              >
                התחברו
              </Link>
            )}
          </div>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          {!authed && (
            <Link
              to="/post-signup"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]"
            >
              התחברו
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center text-dust transition hover:text-foreground"
            aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-iron/20 bg-background/98 backdrop-blur-sm sm:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={"exact" in item && item.exact ? { exact: true } : undefined}
                  className="px-2 py-2.5 text-sm font-medium transition-colors"
                  inactiveProps={{ className: "text-dust" }}
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
              {authed && (
                <>
                  <Link
                    to="/dashboard"
                    className="px-2 py-2.5 text-sm font-medium text-dust transition hover:text-foreground"
                  >
                    דשבורד
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-2 py-2.5 text-right text-sm font-medium text-dust transition hover:text-foreground"
                  >
                    יציאה
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function NavLink({
  to,
  exact,
  children,
}: {
  to: string;
  exact?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className="relative px-3 py-1.5 text-sm font-medium transition-colors"
      inactiveProps={{
        className: "text-dust hover:text-foreground",
      }}
      activeProps={{
        className: "text-foreground",
      }}
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </>
      )}
    </Link>
  );
}
