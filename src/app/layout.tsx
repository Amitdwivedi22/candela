import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Candela — AI Project Brief Generator",
  description:
    "Tell Candela where you are in your course and get a personalised, actionable project brief in seconds. Powered by Claude.",
  openGraph: {
    title: "Candela — AI Project Brief Generator",
    description:
      "Tell Candela where you are in your course and get a personalised, actionable project brief in seconds. Powered by Claude.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
        Emoji favicon trick: render an SVG data-URI that the browser treats
        as a real favicon. No extra file needed.
      */}
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-[#0A0A0F] text-white">
          {children}
        </div>
      </body>
    </html>
  );
}
