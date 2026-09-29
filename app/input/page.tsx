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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
          <Sparkles className="h-4 w-4" />
          Step 1 of 4 — Input
        </div>
        <h1 className="text-3xl font-bold">Paste your Resume &amp; JD</h1>
        <p className="text-muted-foreground mt-1">
          Provide both inputs below. The analysis will match your resume against the job description.
        </p>
        {/* Load Sample Data button */}
        <div className="mt-3">
          <button
            type="button"
            id="load-sample-btn"
            onClick={loadSampleData}
            disabled={isLoadingSample || isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Inputs */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border bg-card p-6">
          <ResumeInput
            value={state.resumeRaw}
            onChange={(text) => dispatch({ type: "SET_RESUME_RAW", payload: text })}
          />
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <JDInput
            value={state.jdRaw}
            onChange={(text) => dispatch({ type: "SET_JD_RAW", payload: text })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="button"
          id="analyze-btn"
          disabled={!canAnalyze || isAnalyzing}
          onClick={handleAnalyze}
          className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {pipelineStatus && isAnalyzing && (
          <p className="text-sm text-primary animate-pulse">
            {pipelineStatus}
          </p>
        )}

        {!canAnalyze && !isAnalyzing && (
          <p className="text-sm text-muted-foreground">
            Please add both a resume and job description to continue.
          </p>
        )}
      </div>

      {/* Sample data toast */}
      {sampleToast && (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {sampleToast}
        </div>
      )}

      {/* Error Display */}
      {state.status === "error" && state.errors.length > 0 && (
        <ErrorBanner
          title="Analysis failed"
          errors={state.errors}
          onRetry={handleAnalyze}
          onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
          className="mt-4"
        />
      )}

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <InputPageInner />
    </Suspense>
  );
}
