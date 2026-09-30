"use client";

import Link from "next/link";
import {
  ArrowRight,
  ScanSearch,
  Pencil,
  Download,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ── Feature cards ────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ScanSearch,
    step: "01",
    title: "Analyze",
    description:
      "Paste your resume and job description. Groq LLM parses both and scores your match (0–100) across skills, keywords, responsibilities, and seniority.",
    accent: "text-zinc-200",
    iconBg: "bg-white/5 border-white/10",
  },
  {
    icon: Pencil,
    step: "02",
    title: "Tailor",
    description:
      "Every bullet point is rewritten to align with the JD — with confidence scores, risk flags, and the exact reasoning behind each change.",
    accent: "text-emerald-300",
    iconBg: "bg-emerald-500/8 border-emerald-500/20",
  },
  {
    icon: Download,
    step: "03",
    title: "Export",
    description:
      "Download a clean ATS-friendly resume PDF or a full side-by-side comparison proof artifact. You accept or revert every change first.",
    accent: "text-amber-300",
    iconBg: "bg-amber-500/8 border-amber-500/20",
  },
];

/* ── Principles ───────────────────────────────────────────────── */
const PRINCIPLES = [
  {
    icon: ShieldCheck,
    text: "No fabricated experience, metrics, or certifications",
    color: "text-emerald-300",
  },
  {
    icon: FileCheck,
    text: "Every rewrite has a stated reason and confidence level",
    color: "text-zinc-300",
  },
  {
    icon: Zap,
    text: "Risk-flagged bullets require your explicit review",
    color: "text-amber-300",
  },
  {
    icon: TrendingUp,
    text: "Side-by-side diff so you see every change made",
    color: "text-emerald-300",
  },
];

/* ── Stat counters ────────────────────────────────────────────── */
const STATS = [
  { value: 26, suffix: " pts", prefix: "+", label: "Avg score lift" },
  { value: 6,  suffix: "",     prefix: "",  label: "LLM pipeline steps" },
  { value: 3,  suffix: "",     prefix: "",  label: "Confidence levels" },
];

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * ease));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
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

/* ── Tilted paper resume mockup ────────────────────────────────── */
function TiltedPaperMockup() {
  return (
    <div className="relative h-[500px] w-full flex items-center justify-center select-none">
      {/* ── Back card — "Original" resume, white, rotated left ─── */}
      <div
        className="absolute w-[340px] bg-white rounded-xl shadow-2xl p-8 -rotate-6 border border-zinc-200 text-zinc-900"
        style={{ height: 420 }}
        aria-hidden="true"
      >
        {/* Mock header */}
        <div className="mb-5">
          <div className="h-3 w-1/2 bg-zinc-800 rounded mb-1.5" />
          <div className="h-2 w-1/3 bg-zinc-400 rounded" />
        </div>
        {/* Section label */}
        <div className="h-1.5 w-20 bg-zinc-300 rounded mb-3" />
        {/* Lines */}
        <div className="space-y-2 mb-5">
          <div className="h-2 w-full bg-zinc-200 rounded" />
          <div className="h-2 w-5/6 bg-zinc-200 rounded" />
          <div className="h-2 w-4/5 bg-zinc-200 rounded" />
        </div>
        {/* Section label */}
        <div className="h-1.5 w-24 bg-zinc-300 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-zinc-200 rounded" />
          <div className="h-2 w-3/4 bg-zinc-200 rounded" />
          <div className="h-2 w-full bg-zinc-200 rounded" />
          <div className="h-2 w-2/3 bg-zinc-200 rounded" />
        </div>
        {/* Label watermark */}
        <div className="absolute bottom-5 right-5">
          <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">
            Original
          </span>
        </div>
      </div>

      {/* ── Front card — "Tailored" resume, parchment, rotated right ── */}
      <div
        className="absolute w-[340px] bg-[#f4ede4] rounded-xl p-8 rotate-3 border border-zinc-300 text-zinc-900"
        style={{
          height: 420,
          left: "calc(50% - 170px + 48px)",
          top: "calc(50% - 210px + 48px)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
        aria-hidden="true"
      >
        {/* Mock header */}
        <div className="mb-5">
          <div className="h-3 w-1/2 bg-zinc-800 rounded mb-1.5" />
          <div className="h-2 w-1/3 bg-zinc-500 rounded" />
        </div>
        {/* Section label */}
        <div className="h-1.5 w-20 bg-zinc-400 rounded mb-3" />
        {/* Lines — with yellow highlight on "tailored" bullet */}
        <div className="space-y-2 mb-5">
          <div className="h-2 w-full bg-zinc-300 rounded" />
          <div className="relative">
            <div className="h-5 w-5/6 rounded flex items-center px-1 bg-yellow-200/50">
              <div className="h-1.5 w-4/5 bg-zinc-600 rounded" />
            </div>
          </div>
          <div className="h-2 w-4/5 bg-zinc-300 rounded" />
        </div>
        {/* Section label */}
        <div className="h-1.5 w-24 bg-zinc-400 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-zinc-300 rounded" />
          <div className="relative">
            <div className="h-5 w-3/4 rounded flex items-center px-1 bg-yellow-200/50">
              <div className="h-1.5 w-2/3 bg-zinc-600 rounded" />
            </div>
          </div>
          <div className="h-2 w-full bg-zinc-300 rounded" />
          <div className="h-2 w-2/3 bg-zinc-300 rounded" />
        </div>
        {/* Score chip */}
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">
            Tailored
          </span>
          <div className="flex items-center gap-1 bg-emerald-100 rounded-full px-2 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-700">+24 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="min-h-screen page-enter overflow-x-hidden">

      {/* ════════════════════════════════════════════
          HERO — Two-column editorial layout
      ════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── Left column ────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Status badge */}
          <div>
            <span className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-3 py-1 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              {/* Emerald pulse dot */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
              </span>
              Powered by Groq · Truthful by design
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white text-balance">
              Make your resume fit every role.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              Paste your resume and a job description. Get a fully tailored resume
              with match scores, gap analysis, side-by-side diffs, and
              downloadable PDFs — all grounded in truth.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/input"
              id="get-started-btn"
              className="group inline-flex items-center gap-2.5 bg-zinc-100 text-zinc-950 hover:bg-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="/input?demo=true"
              id="view-demo-btn"
              className="inline-flex items-center gap-2.5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200"
            >
              <Zap className="h-4 w-4 text-zinc-400" />
              Try with Sample Resume
            </a>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-zinc-600 max-w-sm">
            All AI suggestions must be verified before use. Never include experience you don&apos;t have.
          </p>
        </div>

        {/* ── Right column — Tilted Paper Mockup ─────────────────── */}
        <div className="hidden lg:flex items-center justify-center">
          <TiltedPaperMockup />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════════ */}
      <section className="relative border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 divide-x divide-white/[0.06]">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 px-4">
              <p className="text-3xl sm:text-4xl font-display font-bold text-white">
                <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest text-center">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-mono font-semibold tracking-widest uppercase text-zinc-500">
            Three steps
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            From paste to polished PDF
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            The entire tailoring pipeline runs in one click — no uploads, no accounts, no waiting.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, step, title, description, accent, iconBg }, idx) => (
            <div
              key={step}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#141418] overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-1"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Top border accent on hover */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/15 transition-all duration-500" />

              {/* Step number watermark */}
              <span className="absolute top-5 right-5 text-7xl font-black select-none pointer-events-none text-white/[0.03] group-hover:text-white/[0.06] transition-colors duration-300">
                {step}
              </span>

              <div className="p-6 space-y-4">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${accent}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-2 tracking-tight text-white">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TRUTHFULNESS SECTION
      ════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative rounded-3xl border border-white/[0.07] bg-[#141418] overflow-hidden">
          {/* Subtle corner glows — warm, not blue */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500/[0.04] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          {/* Inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Left */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300 text-xs font-semibold tracking-widest uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Truthfulness Guarantee
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                  No hallucinations.{" "}
                  <span className="text-zinc-400">Ever.</span>
                </h2>
                <p className="text-zinc-500 leading-relaxed">
                  Resume Shapeshifter will never fabricate experience, invent
                  metrics, or add certifications you don&apos;t have. Every suggestion
                  is grounded in your actual resume — with explicit warnings when
                  anything needs your verification.
                </p>
                <Link
                  href="/input"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors group"
                >
                  Start tailoring your resume
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right — principle list */}
              <ul className="space-y-3">
                {PRINCIPLES.map(({ icon: Icon, text, color }) => (
                  <li
                    key={text}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 hover:border-white/10 transition-colors"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <span className="text-sm text-zinc-400 leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06]">
        <div className="separator-gradient" />
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-zinc-500" />
            <span className="font-display font-bold text-sm tracking-tight text-zinc-300">Resume Shapeshifter</span>
            <span className="text-zinc-700 text-xs">· AI-powered resume tailoring</span>
          </div>
          <p className="text-xs text-zinc-700 text-center sm:text-right max-w-xs leading-relaxed">
            ⚠ All AI suggestions must be verified for accuracy. Never include experience you don&apos;t have.
          </p>
        </div>
      </footer>
    </main>
  );
}
