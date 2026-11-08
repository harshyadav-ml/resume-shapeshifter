import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Link from "next/link";

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
          <nav className="sticky top-0 z-50 border-b border-[#23232b] bg-[#070709]/95 backdrop-blur-xl">
            {/* Top hairline accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#41F0B1]/20 to-transparent" />

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 md:px-10 lg:px-12 h-16 flex items-center justify-between">
              {/* Wordmark */}
              <Link
                href="/"
                className="flex items-center pl-2 sm:pl-4 hover:opacity-85 transition-opacity select-none"
                aria-label="Resume Shapeshifter Home"
              >
                <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  Resume Shapeshifter
                </span>
              </Link>

              {/* Nav links */}
              <div className="flex items-center gap-2 pr-2 sm:pr-4">
                <Link
                  href="/history"
                  id="nav-history"
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors font-medium px-3.5 py-2 rounded-lg hover:bg-white/5"
                >
                  History
                </Link>
                <Link
                  href="/input"
                  id="nav-get-started"
                  className="text-xs sm:text-sm font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-all px-4 py-2 rounded-full shadow-sm"
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
