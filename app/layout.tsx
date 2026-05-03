import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Candela | Your degree won't get you hired. What you build will.",
  description:
    "Candela turns what you study into projects hiring managers can open. For 16 to 22 year olds building software when junior roles are scarce.",
  keywords: ["project brief", "AI learning", "coding project", "student projects", "personalized"],
  openGraph: {
    title: "Candela | Your degree won't get you hired. What you build will.",
    description:
      "Candela turns what you study into projects hiring managers can open.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕯️</text></svg>"
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen bg-[#0A0A0A] text-white">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
