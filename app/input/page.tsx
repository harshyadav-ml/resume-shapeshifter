"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/lib/context";
import { mockTailoringRun, mockResume, mockJD } from "@/lib/mock-data";
import { runTailoringPipeline, ApiError } from "@/lib/api";
import ErrorBanner from "@/components/ErrorBanner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  FlaskConical,
  CheckCircle2,
  FileText,
  FileUp,
  X,
  Briefcase,
  Link as LinkIcon,
  Clipboard,
  Terminal,
} from "lucide-react";

const MAX_CHARS = 12000;

const MOCK_JD_FALLBACK = `Senior Frontend Engineer — Nebula Systems

We're looking for a Senior Frontend Engineer to join our core product team.

Required Skills:
- React (4+ years)
- TypeScript (strong proficiency required)
- GraphQL with Apollo or urql
- CI/CD pipeline experience (GitHub Actions preferred)
- Strong unit and integration testing background

Preferred:
- Next.js, AWS, Storybook, WebSockets, Design Systems

Responsibilities:
- Lead frontend architecture for our enterprise data dashboard
- Collaborate with design to build and maintain a component library
- Define GraphQL contracts with backend teams
- Mentor junior engineers; lead biweekly frontend guild meetings
- Drive CI/CD improvements to reduce deployment lead time

Qualifications:
- 4+ years React experience in production SaaS environments
- Track record of improving test coverage and code quality
- Experience leading or mentoring small teams`;

function InputPageInner() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  // Functional logic & UI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleToast, setSampleToast] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load demo data if ?demo=true
  useEffect(() => {
    if (isDemo && !state.resumeRaw) {
      const resumeText = [
        `${mockResume.contact.name} | ${mockResume.contact.email}`,
        "",
        "SUMMARY",
        mockResume.summary,
        "",
        "EXPERIENCE",
        ...mockResume.experience.flatMap((e) => [
          `${e.title} at ${e.company} (${e.startDate} – ${e.endDate})`,
          ...e.bullets.map((b) => `• ${b}`),
          "",
        ]),
      ].join("\n");

      const jdText = `${mockJD.jobTitle} — ${mockJD.company}\n\nRequired: ${mockJD.requiredSkills.join(", ")}\n\nResponsibilities:\n${mockJD.responsibilities.map((r) => `• ${r}`).join("\n")}`;

      dispatch({ type: "SET_RESUME_RAW", payload: resumeText });
      dispatch({ type: "SET_JD_RAW", payload: jdText });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  // File upload handler
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        dispatch({ type: "SET_RESUME_RAW", payload: text.slice(0, MAX_CHARS) });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Sample data loading
  const loadSampleData = async () => {
    setIsLoadingSample(true);
    setSampleToast("");
    try {
      const [resumeRes, jdRes] = await Promise.all([
        fetch("/sample-resume.txt"),
        fetch("/sample-jd.txt"),
      ]);
      const [resumeText, jdText] = await Promise.all([
        resumeRes.text(),
        jdRes.text(),
      ]);
      dispatch({ type: "SET_RESUME_RAW", payload: resumeText });
      dispatch({ type: "SET_JD_RAW", payload: jdText });
      setSampleToast("Sample data loaded — ready to analyze!");
      setTimeout(() => setSampleToast(""), 4000);
    } catch {
      setSampleToast("Failed to load sample data.");
      setTimeout(() => setSampleToast(""), 3000);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Main pipeline trigger
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setPipelineStatus("Starting analysis…");
    dispatch({ type: "SET_STATUS", payload: "parsing" });

    // If ?demo=true — use mock data (offline development)
    if (isDemo) {
      await new Promise((r) => setTimeout(r, 1500));
      dispatch({ type: "SET_RUN", payload: mockTailoringRun });
      setIsAnalyzing(false);
      setPipelineStatus("");
      router.push("/analyze");
      return;
    }

    // Real Groq API pipeline
    try {
      setPipelineStatus("Connecting to pipeline…");
      const result = await runTailoringPipeline(
        state.resumeRaw,
        state.jdRaw,
        (progress) => {
          setPipelineStatus(`${progress.message} [${progress.step}]`);
        }
      );

      if (result.status === "error") {
        throw new Error(result.errors?.join("; ") || "Pipeline failed");
      }

      dispatch({
        type: "SET_RUN",
        payload: { run: result.run, status: result.status, errors: result.errors },
      });
      setIsAnalyzing(false);
      setPipelineStatus("");
      router.push("/analyze");
    } catch (err) {
      console.error("[input] Pipeline error:", err);
      let message: string;
      if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = "Analysis failed. Please try again.";
      }
      dispatch({ type: "SET_ERRORS", payload: [message] });
      setIsAnalyzing(false);
      setPipelineStatus("");
    }
  };

  const canAnalyze = state.resumeRaw.trim().length > 50 && state.jdRaw.trim().length > 50;
  const resumeCharCount = state.resumeRaw.length;
  const resumeCharPercent = Math.min((resumeCharCount / MAX_CHARS) * 100, 100);

  return (
    <main className="min-h-screen bg-[#070709] text-[#f3f4f6] px-6 sm:px-8 md:px-10 lg:px-12 py-8 md:py-10 selection:bg-[#41F0B1]/20 selection:text-[#41F0B1]">
      <div className="max-w-[1260px] mx-auto space-y-7">
        {/* ── Stepper & Page Heading ────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono font-medium">
            <Terminal className="w-4 h-4 text-[#41F0B1]" />
            <span>Step 1 of 4 — Input</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
                Paste your Resume &amp; Job Description
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base mt-1.5 leading-relaxed">
                Provide both inputs below. The AI analysis engine will parse your qualifications and match them against the target role.
              </p>
            </div>

            {/* Quick Action: Load Sample Data */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                id="load-sample-btn"
                onClick={loadSampleData}
                disabled={isLoadingSample || isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#23232b] bg-[#101011] text-zinc-200 hover:text-white hover:border-[#41F0B1]/40 hover:bg-[#161619] text-xs sm:text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoadingSample ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#41F0B1]" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4 text-[#41F0B1]" />
                    <span>Load Sample Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── Sample Notification Toast ─────────────────────────── */}
        {sampleToast && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#41F0B1] bg-[#41F0B1]/10 border border-[#41F0B1]/20 px-4 py-2.5 rounded-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{sampleToast}</span>
          </div>
        )}

        {/* ── 2-Column Input Cards Grid ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Resume Input */}
          <section
            aria-label="Resume Input Section"
            className="bg-[#101011] border border-[#23232b] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#23232b]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#171a22] rounded-lg border border-[#23232b] text-[#41F0B1]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Your Resume</h2>
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono font-medium">
                    Source Document
                  </span>
                </div>
              </div>

              {state.resumeRaw && (
                <button
                  type="button"
                  id="clear-resume"
                  onClick={() => dispatch({ type: "SET_RESUME_RAW", payload: "" })}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-rose-400 font-medium transition-colors px-2.5 py-1.5 rounded hover:bg-rose-500/10"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Drag & Drop Area + Textarea */}
            <div
              className={cn(
                "relative rounded-lg border transition-all duration-150 bg-[#0b0b0e] p-3.5",
                isDragging
                  ? "border-[#41F0B1] bg-[#41F0B1]/5 shadow-[0_0_15px_rgba(65,240,177,0.15)]"
                  : "border-[#23232b] hover:border-[#2f2f3a]"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <textarea
                id="resume-textarea"
                value={state.resumeRaw}
                onChange={(e) =>
                  dispatch({
                    type: "SET_RESUME_RAW",
                    payload: e.target.value.slice(0, MAX_CHARS),
                  })
                }
                placeholder={`Paste your resume here (plain text, markdown, or copy-paste from PDF/Word)...\n\nOr drag and drop a .txt, .pdf, or .docx file anywhere on this card.`}
                className="min-h-[320px] w-full bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
                aria-label="Resume text input"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc,.md"
                onChange={handleFileInput}
                className="hidden"
                id="resume-file-input"
                aria-label="Upload resume file"
              />
            </div>

            {/* Card Footer: Progress + Upload Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="h-2 flex-1 rounded-full bg-[#181a22] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      resumeCharPercent > 90 ? "bg-amber-400" : "bg-[#41F0B1]"
                    )}
                    style={{ width: `${resumeCharPercent}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-300 font-mono font-medium whitespace-nowrap">
                  {resumeCharCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                </span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg bg-[#181a22] hover:bg-[#23232b] text-zinc-200 hover:text-white border border-[#23232b] transition-all shadow-sm"
              >
                <FileUp className="h-4 w-4 text-[#41F0B1]" />
                <span>Browse File</span>
              </button>
            </div>
          </section>

          {/* Card 2: Job Description Input */}
          <section
            aria-label="Job Description Input Section"
            className="bg-[#101011] border border-[#23232b] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#23232b]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#171a22] rounded-lg border border-[#23232b] text-[#41F0B1]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Job Description</h2>
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono font-medium">
                    Target Role
                  </span>
                </div>
              </div>

              {state.jdRaw && (
                <button
                  type="button"
                  id="clear-jd"
                  onClick={() => dispatch({ type: "SET_JD_RAW", payload: "" })}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-rose-400 font-medium transition-colors px-2.5 py-1.5 rounded hover:bg-rose-500/10"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* URL Field (Phase 2 Preview) */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#23232b] bg-[#0b0b0e]">
              <LinkIcon className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                id="jd-url-input"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="Paste job posting URL (Phase 2 feature)"
                disabled
                className="flex-1 text-xs sm:text-sm bg-transparent outline-none placeholder:text-zinc-500 text-zinc-400 cursor-not-allowed font-mono"
                aria-label="Job posting URL (coming in Phase 2)"
              />
              <span className="text-xs font-mono font-medium text-zinc-300 px-2 py-0.5 rounded bg-[#181a22] border border-[#23232b] whitespace-nowrap">
                Phase 2
              </span>
            </div>

            {/* Textarea Container */}
            <div className="rounded-lg border border-[#23232b] hover:border-[#2f2f3a] transition-all bg-[#0b0b0e] p-3.5">
              <textarea
                id="jd-textarea"
                value={state.jdRaw}
                onChange={(e) => dispatch({ type: "SET_JD_RAW", payload: e.target.value })}
                placeholder="Paste the full job description here (requirements, responsibilities, tech stack, and qualifications)..."
                className="min-h-[265px] w-full bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
                aria-label="Job description text input"
              />
            </div>

            {/* Card Footer: Char Count + Example Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-zinc-300 font-mono font-medium">
                {state.jdRaw.length.toLocaleString()} characters
              </span>

              <button
                type="button"
                id="load-example-jd"
                onClick={() => dispatch({ type: "SET_JD_RAW", payload: MOCK_JD_FALLBACK })}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg bg-[#181a22] hover:bg-[#23232b] text-zinc-200 hover:text-white border border-[#23232b] transition-all shadow-sm"
              >
                <Clipboard className="h-4 w-4 text-[#41F0B1]" />
                <span>Paste Example JD</span>
              </button>
            </div>
          </section>
        </div>

        {/* ── Actions Control Panel ─────────────────────────────── */}
        <section
          aria-label="Pipeline Actions"
          className="bg-[#101011] border border-[#23232b] rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="analyze-btn"
              disabled={!canAnalyze || isAnalyzing}
              onClick={handleAnalyze}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#41F0B1] text-[#070709] font-medium text-sm hover:bg-[#38d89e] transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#070709]" />
                  <span>Analyzing with AI…</span>
                </>
              ) : (
                <span>Analyze &amp; Tailor Resume →</span>
              )}
            </button>

            {pipelineStatus && isAnalyzing && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[#41F0B1] bg-[#41F0B1]/10 border border-[#41F0B1]/20 px-3.5 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#41F0B1] animate-ping" />
                <span>{pipelineStatus}</span>
              </div>
            )}
          </div>

          {!canAnalyze && !isAnalyzing && (
            <div className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
              <span>Provide both resume &amp; job description (&gt;50 characters) to continue</span>
            </div>
          )}

          {canAnalyze && !isAnalyzing && (
            <div className="text-xs sm:text-sm text-[#41F0B1] font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#41F0B1] inline-block" />
              <span>Ready for matching</span>
            </div>
          )}
        </section>

        {/* ── Error Notification ────────────────────────────────── */}
        {state.status === "error" && state.errors.length > 0 && (
          <ErrorBanner
            title="Analysis failed"
            errors={state.errors}
            onRetry={handleAnalyze}
            onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
            className="mt-4"
          />
        )}
      </div>
    </main>
  );
}

export default function InputPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#41F0B1]" />
        </div>
      }
    >
      <InputPageInner />
    </Suspense>
  );
}
