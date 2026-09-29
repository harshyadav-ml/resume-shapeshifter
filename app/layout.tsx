import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Link from "next/link";
import { Zap } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        <AppProvider>
          {/* Global Nav */}
          <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-base hover:text-primary transition-colors"
                aria-label="Resume Shapeshifter Home"
              >
                <Zap className="h-5 w-5 text-primary" />
                <span className="gradient-text">Resume Shapeshifter</span>
              </Link>
              <div className="flex items-center gap-5">
                <Link
                  href="/history"
                  id="nav-history"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  History
                </Link>
                <Link
                  href="/input"
                  id="nav-get-started"
                  className="text-sm font-semibold text-primary hover:underline transition-colors"
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
