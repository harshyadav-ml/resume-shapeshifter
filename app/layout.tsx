import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Link from "next/link";
import { Zap } from "lucide-react";

/* ── Fonts ──────────────────────────────────────────────────────
   Inter      → body / UI copy (font-sans)
   Plus Jakarta Sans → display headings (font-display)
────────────────────────────────────────────────────────────── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Resume Shapeshifter — AI-Powered Resume Tailoring",
  description:
    "Upload your resume and a job description. Get an AI-tailored resume with a side-by-side diff, match score, gap analysis, and downloadable PDFs — all grounded in truth.",
  keywords: [
    "resume tailoring",
    "AI resume",
    "job application",
    "resume optimizer",
    "ATS resume",
    "resume builder",
  ],
  openGraph: {
    title: "Resume Shapeshifter",
    description: "AI-powered resume tailoring with full explainability.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased font-sans">
        <AppProvider>
          {/* ── Global Nav ─────────────────────────────────────────── */}
          <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0c0e]/90 backdrop-blur-xl">
            {/* Top hairline accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              {/* Wordmark */}
              <Link
                href="/"
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                aria-label="Resume Shapeshifter Home"
              >
                <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-zinc-300" />
                </div>
                <span className="font-display font-bold text-sm tracking-tight text-white">
                  Resume Shapeshifter
                </span>
              </Link>

              {/* Nav links */}
              <div className="flex items-center gap-1">
                <Link
                  href="/history"
                  id="nav-history"
                  className="text-[13px] text-zinc-500 hover:text-zinc-200 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  History
                </Link>
                <Link
                  href="/input"
                  id="nav-get-started"
                  className="text-[13px] font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-all px-4 py-1.5 rounded-full"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>

          {children}
        </AppProvider>
      </body>
    </html>
  );
}
