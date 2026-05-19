import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import NavigationProgress from "@/components/NavigationProgress";
import PageTransition from "@/components/PageTransition";
import { auth } from "@/lib/auth";

const geistSans = localFont({
  src: "../src/app/fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
});

const geistDisplay = localFont({
  src: "../src/app/fonts/GeistVF.woff",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nextstep | Build what comes next.",
  description:
    "Nextstep turns what you just learned into a project brief you can start tonight, with runnable scaffolds and sharp checkpoints.",
  keywords: ["project brief", "AI learning", "coding project", "student projects", "personalized"],
  openGraph: {
    title: "Nextstep | Build what comes next.",
    description:
      "Nextstep turns fresh course concepts into concrete projects you can ship tonight.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistDisplay.variable}`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ff7a3d'/%3E%3Cstop offset='100%25' stop-color='%23ffb36b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='8' y='8' width='84' height='84' rx='24' fill='%230b0b0b'/%3E%3Crect x='10' y='10' width='80' height='80' rx='22' fill='none' stroke='url(%23g)' stroke-width='3'/%3E%3Cpath d='M30 72V28h8l24 29V28h8v44h-8L38 43v29z' fill='url(%23g)'/%3E%3C/svg%3E"
        />
      </head>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <AuthProvider session={session}>
          {/* Orange thin progress bar — fires on every route change */}
          <NavigationProgress />
          <div className="min-h-screen bg-[var(--night-ink)] text-[var(--text-main)]">
            <PageTransition>{children}</PageTransition>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
