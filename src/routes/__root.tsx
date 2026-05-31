import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";
import { prefetchAuthedData, sessionQueryOptions } from "@/lib/queries";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ProfileMenu } from "@/components/ProfileMenu";
import appCss from "../styles.css?url";
import { queryClient } from "@/lib/query-client";
import { clearToken, isStoredAdmin, setStoredRole } from "@/lib/auth";
import { KachKivunLogo } from "@/components/KachKivunLogo";
import { SITE_DESCRIPTION, SITE_NAME_HE } from "@/lib/brand";
import { ARIA, MAIN_CONTENT_ID, MOBILE_NAV_ID } from "@/lib/a11y";
import { IDF_BACKDROP_IMAGE_URLS, preloadIdfBackdropImages } from "@/lib/idf-images";

export const Route = createRootRoute({
  shellComponent: RootDocument,
  component: RootLayout,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_DESCRIPTION },
      { name: "description", content: SITE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "צבא, צה״ל, גיוס, דפ״ר, מא״ה, יום המאה, פרופיל רפואי, התאמת תפקיד, שירות צבאי, הכנה לשירות",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "he_IL" },
      { property: "og:site_name", content: SITE_NAME_HE },
      { property: "og:title", content: SITE_DESCRIPTION },
      { property: "og:description", content: SITE_DESCRIPTION },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
      ...IDF_BACKDROP_IMAGE_URLS.slice(0, 2).map((href) => ({
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
  const queryClient = useQueryClient();
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

  useEffect(() => {
    const token = getToken();
    if (token) prefetchAuthedData(queryClient, token);
  }, [pathname, queryClient]);

  function logout() {
    clearToken();
    queryClient.clear();
    setAuthed(false);
    navigate({ to: "/" });
  }

  return (
    <>
      {!isBareShell && (
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          {ARIA.skipToMain}
        </a>
      )}
      {!isBareShell && <SiteHeader authed={authed} tokenPresent={authed} onLogout={logout} />}
      <main id={MAIN_CONTENT_ID} className="animate-fade-in" aria-label={ARIA.main} tabIndex={-1}>
        <Outlet />
      </main>
      {!isBareShell && (
        <footer className="border-t border-iron/30 mt-20" aria-label={ARIA.footer}>
          <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-4 px-4 py-6 text-xs text-dust/60 sm:flex-row sm:justify-between sm:px-6 sm:py-8">
            <span className="text-dust/50">
              &copy; {new Date().getFullYear()} {SITE_NAME_HE}
            </span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link to="/" className="transition hover:text-foreground">
                ראשי
              </Link>
              <Link to="/role-insights" className="transition hover:text-foreground">
                תובנות
              </Link>
              <span className="cursor-default">פרטיות</span>
              <span className="cursor-default">תנאי שימוש</span>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

/** Main tools in header — profile lives in ProfileMenu */
const NAV_AUTHED = [
  { to: "/ai-secretary", label: "מזכיר AI" },
  { to: "/ai-counselor", label: "התאמת תפקידים" },
] as const;

function SiteHeader({
  authed,
  tokenPresent,
  onLogout,
}: {
  authed: boolean;
  tokenPresent: boolean;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useQuery(sessionQueryOptions(tokenPresent));

  useEffect(() => {
    if (session?.role) setStoredRole(session.role);
  }, [session?.role]);

  const isAdmin = session?.role === "admin" || (tokenPresent && isStoredAdmin());

  const NAV_ITEMS = useMemo(() => (authed ? [...NAV_AUTHED] : []), [authed]);

  const profileName =
    session?.preferredName?.trim() ||
    (session?.email ? session.email.split("@")[0] : undefined);
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
      aria-label={ARIA.siteHeader}
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
        <KachKivunLogo size="md" linked />

        {/* Desktop: nav + single action */}
        <div className="hidden sm:flex items-center gap-3">
          {NAV_ITEMS.length > 0 ? (
            <nav className="flex items-center" aria-label={ARIA.navPrimary}>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  exact={"exact" in item ? item.exact : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}

          {authed ? (
            <ProfileMenu displayName={profileName} isAdmin={isAdmin} onLogout={onLogout} />
          ) : (
            <Link
              to="/post-signup"
              className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]"
            >
              התחברו
            </Link>
          )}
        </div>

        {/* Mobile: login (guests) or menu (signed in) */}
        <div className="flex items-center gap-2 sm:hidden">
          {authed ? (
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center text-dust transition hover:text-foreground"
              aria-label={mobileOpen ? ARIA.closeMenu : ARIA.openMenu}
              aria-expanded={mobileOpen}
              aria-controls={MOBILE_NAV_ID}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          ) : (
            <Link
              to="/post-signup"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.97]"
            >
              התחברו
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown (signed-in only) */}
      <AnimatePresence>
        {authed && mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-iron/20 bg-background/98 backdrop-blur-sm sm:hidden"
          >
            <nav
              id={MOBILE_NAV_ID}
              className="mx-auto flex max-w-7xl flex-col px-4 py-3"
              aria-label={ARIA.navMobile}
            >
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
              {authed ? (
                <ProfileMenu
                  variant="list"
                  displayName={profileName}
                  isAdmin={isAdmin}
                  onLogout={onLogout}
                  onNavigate={() => setMobileOpen(false)}
                />
              ) : (
                <Link to="/post-signup" className="px-2 py-2.5 text-sm font-semibold text-primary">
                  התחברו
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function NavLink({ to, exact, children }: { to: string; exact?: boolean; children: ReactNode }) {
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
