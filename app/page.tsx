"use client";

import Link from "next/link";
import { ArrowRight, ScanSearch, Pencil, Download, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: ScanSearch,
    step: "01",
    title: "Analyze",
    description:
      "Paste your resume and job description. Our AI parses both and scores your current match (0–100) with full explanations.",
  },
  {
    icon: Pencil,
    step: "02",
    title: "Tailor",
    description:
      "Every resume bullet is rewritten to align with the JD — with confidence scores, risk flags, and the exact reason for each change.",
  },
  {
    icon: Download,
    step: "03",
    title: "Export",
    description:
      "Download a clean tailored resume PDF or a side-by-side comparison proof artifact. You review and confirm every change first.",
  },
];

const PRINCIPLES = [
  "No fabricated experience, metrics, or certifications",
  "Every rewrite has a stated reason",
  "Risk-flagged bullets require your review",
  "Side-by-side diff so you see every change",
];

const STATS = [
  { label: "Avg. score improvement", value: 26, suffix: " pts", prefix: "+" },
  { label: "Pipeline steps automated", value: 6, suffix: "", prefix: "" },
  { label: "Confidence levels tracked", value: 3, suffix: "", prefix: "" },
];

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-powered resume tailoring · Truthful by design
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Resume{" "}
            <span className="gradient-text">Shapeshifter</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste your resume and a job description. Get a fully tailored resume with
            match scores, gap analysis, side-by-side diffs, and downloadable PDFs —
            all grounded in the truth.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/input"
              id="get-started-btn"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="/input?demo=true"
              id="view-demo-btn"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-card text-foreground font-semibold text-base hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              <Zap className="h-4 w-4 text-primary" />
              Try with Sample Resume
            </a>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">
                <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground">
            Three steps from raw resume to tailored PDF.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="rounded-2xl border bg-card p-6 relative overflow-hidden group hover:border-primary/40 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Step number (background) */}
              <span className="absolute top-4 right-5 text-6xl font-black text-muted/25 select-none group-hover:text-primary/10 transition-colors">
                {step}
              </span>

              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Truthfulness section */}
      <section className="max-w-5xl mx-auto px-6 py-12 mb-8">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Truthfulness First
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Truthfulness is non-negotiable
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Resume Shapeshifter will never fabricate experience, invent metrics,
                or add certifications you don&apos;t have. Every suggestion is grounded
                in your actual resume content — with explicit warnings when anything
                needs your verification.
              </p>
              <Link
                href="/input"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Start tailoring your resume <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="space-y-2.5 flex-1">
              {PRINCIPLES.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/20">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Resume Shapeshifter</span>
            <span>· AI-powered resume tailoring</span>
          </div>
          <p className="text-center sm:text-right leading-relaxed max-w-xs">
            ⚠️ All AI suggestions must be verified for accuracy before use. Never include experience you don&apos;t have.
          </p>
        </div>
      </footer>
    </main>
  );
}
