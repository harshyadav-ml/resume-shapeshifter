"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResumeInput from "@/components/ResumeInput";
import JDInput from "@/components/JDInput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { useAppContext } from "@/lib/context";
import { mockTailoringRun, mockResume, mockJD } from "@/lib/mock-data";
import { runTailoringPipeline } from "@/lib/api";
import ErrorBanner from "@/components/ErrorBanner";
import { ArrowRight, Loader2, Sparkles, FlaskConical, CheckCircle2 } from "lucide-react";

function InputPageInner() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleToast, setSampleToast] = useState("");

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
      setSampleToast("Sample data loaded — click Analyze to see the full pipeline!");
      setTimeout(() => setSampleToast(""), 4000);
    } catch {
      setSampleToast("Failed to load sample data.");
      setTimeout(() => setSampleToast(""), 3000);
    } finally {
      setIsLoadingSample(false);
    }
  };

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
      setPipelineStatus("Parsing resume & JD, scoring, tailoring bullets…");
      const result = await runTailoringPipeline(state.resumeRaw, state.jdRaw);

      if (result.status === "error") {
        throw new Error(result.errors?.join("; ") || "Pipeline failed");
      }

      dispatch({ type: "SET_RUN", payload: { run: result.run, status: result.status, errors: result.errors } });
      setIsAnalyzing(false);
      setPipelineStatus("");
      router.push("/analyze");
    } catch (err) {
      console.error("[input] Pipeline error:", err);
      const message = err instanceof Error ? err.message : "Analysis failed";
      dispatch({ type: "SET_ERRORS", payload: [message] });
      setIsAnalyzing(false);
      setPipelineStatus("");
    }
  };

  const canAnalyze = state.resumeRaw.trim().length > 50 && state.jdRaw.trim().length > 50;

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 page-enter">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 font-mono mb-3">
          <Sparkles className="h-4 w-4" />
          Step 1 of 4 — Input
        </div>

        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Paste your Resume &amp; JD
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Provide both inputs below. The analysis will match your resume against the job description.
        </p>

        {/* Load Sample Data */}
        <div className="mt-4">
          <button
            type="button"
            id="load-sample-btn"
            onClick={loadSampleData}
            disabled={isLoadingSample || isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoadingSample ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                <FlaskConical className="h-3.5 w-3.5" />
                Load Sample Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Input panels ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {/* Resume panel */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141418] p-6">
          <ResumeInput
            value={state.resumeRaw}
            onChange={(text) => dispatch({ type: "SET_RESUME_RAW", payload: text })}
          />
        </div>
        {/* JD panel */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141418] p-6">
          <JDInput
            value={state.jdRaw}
            onChange={(text) => dispatch({ type: "SET_JD_RAW", payload: text })}
          />
        </div>
      </div>

      {/* ── Actions row ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="button"
          id="analyze-btn"
          disabled={!canAnalyze || isAnalyzing}
          onClick={handleAnalyze}
          className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {pipelineStatus && isAnalyzing && (
          <p className="text-sm text-zinc-500 animate-pulse font-mono">
            {pipelineStatus}
          </p>
        )}

        {!canAnalyze && !isAnalyzing && (
          <p className="text-sm text-zinc-600">
            Please add both a resume and job description to continue.
          </p>
        )}
      </div>

      {/* ── Sample data toast ─────────────────────────────────────── */}
      {sampleToast && (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-400 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {sampleToast}
        </div>
      )}

      {/* ── Error display ─────────────────────────────────────────── */}
      {state.status === "error" && state.errors.length > 0 && (
        <ErrorBanner
          title="Analysis failed"
          errors={state.errors}
          onRetry={handleAnalyze}
          onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
          className="mt-4"
        />
      )}

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="mt-8">
        <DisclaimerBanner />
      </div>
    </main>
  );
}

export default function InputPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <InputPageInner />
    </Suspense>
  );
}
