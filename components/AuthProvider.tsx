"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/**
 * Single SessionProvider for the entire app.
 *
 * Key settings that eliminate duplicate /api/auth/session calls:
 *
 * - `session` prop: the server-rendered session is injected here so the
 *   client has an immediate value and skips an initial network fetch.
 *
 * - `refetchInterval={0}`: disable background polling (default is 0 but
 *   explicit keeps intent clear).
 *
 * - `refetchOnWindowFocus={false}`: NextAuth by default re-fetches the
 *   session every time the user switches tabs / focuses the window. This
 *   is the biggest source of repeated calls in a typical session.
 *
 * - `refetchWhenOffline={false}`: don't attempt fetches with no network.
 */
export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
