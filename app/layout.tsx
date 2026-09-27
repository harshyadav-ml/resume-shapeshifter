import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";

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
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
