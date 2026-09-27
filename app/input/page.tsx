"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResumeInput from "@/components/ResumeInput";
import JDInput from "@/components/JDInput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { useAppContext } from "@/lib/context";
import { mockTailoringRun, mockResume, mockJD } from "@/lib/mock-data";
import { runTailoringPipeline } from "@/lib/api";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

function InputPageInner() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("");

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

      dispatch({ type: "SET_RUN", payload: result.run });
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

      {/* Error Display */}
      {state.status === "error" && state.errors.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-semibold text-destructive mb-1">Analysis failed</p>
          {state.errors.map((err, i) => (
            <p key={i} className="text-sm text-destructive/80">{err}</p>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_ERRORS", payload: [] })}
            className="mt-2 text-xs text-destructive underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
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
