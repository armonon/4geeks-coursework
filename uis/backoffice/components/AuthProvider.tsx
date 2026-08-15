"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  PUBLIC_ROUTES,
  clearToken,
  fetchCurrentUser,
  getToken,
  setUnauthorizedHandler,
  type CurrentUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  /** True until the initial token check has finished. */
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Client-side session guard.
 *
 * Deliberately not Next.js middleware: middleware runs on the server
 * and cannot read localStorage, where AUTH-02 requires the token to
 * live. This provider reads the token in the browser, verifies it
 * against GET /auth/me, and redirects to /login when it is absent or
 * rejected.
 *
 * It wraps only the backoffice. The public website (uis/website) has no
 * provider, no token check, and no redirect.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const publicRoute = isPublicRoute(pathname);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await fetchCurrentUser());
    } catch {
      // Token present but rejected (expired, tampered, account gone).
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Any 401 from a protected call anywhere in the app lands here.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  // Verify the session on mount and whenever the route changes.
  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh, pathname]);

  // Redirect unauthenticated users away from guarded routes.
  useEffect(() => {
    if (loading || publicRoute) return;
    if (!getToken()) router.replace("/login");
  }, [loading, publicRoute, router, user]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
  );

  // Public routes render immediately — no session needed.
  if (publicRoute) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    );
  }

  // Not signed in: render nothing while the redirect above runs, so a
  // protected view never flashes on screen.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Redirecting to sign in…</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
