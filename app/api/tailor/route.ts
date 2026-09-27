/**
 * POST /api/tailor
 * Rewrites resume bullets to align with a JD via Groq.
 * Processes bullets sequentially to respect Groq rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { RewrittenBulletSchema } from "@/lib/schemas";
import {
  BULLET_REWRITER_SYSTEM_PROMPT,
  buildBulletRewriterUserPrompt,
} from "@/lib/prompts/bullet-rewriter";
import type { ResumeProfile, JobDescriptionProfile, TailoredExperienceEntry, RewrittenBullet } from "@/types";

// Small delay between Groq calls to avoid 429s (50ms)
const INTER_CALL_DELAY_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rewriteBullet(
  bullet: string,
  company: string,
  title: string,
  jd: JobDescriptionProfile
): Promise<RewrittenBullet> {
  const userPrompt = buildBulletRewriterUserPrompt(
    bullet,
    company,
    title,
    jd as unknown as Record<string, unknown>
  );
  return await callGroq(
    BULLET_REWRITER_SYSTEM_PROMPT,
    userPrompt,
    RewrittenBulletSchema,
    { temperature: 0.3 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jd } = body as {
      resume: ResumeProfile;
      jd: JobDescriptionProfile;
    };

    if (!resume || !jd) {
      return NextResponse.json(
        { error: "Both resume and jd are required" },
        { status: 422 }
      );
    }

    console.log(
      `[tailor] Starting — ${resume.experience.length} experience entries`
    );

    // Rewrite bullets sequentially
    const tailoredExperience: TailoredExperienceEntry[] = [];

    for (const exp of resume.experience) {
      const rewrittenBullets: RewrittenBullet[] = [];

      for (const bullet of exp.bullets) {
        try {
          const rewritten = await rewriteBullet(
            bullet,
            exp.company,
            exp.title,
            jd
          );
          rewrittenBullets.push(rewritten);
        } catch (err) {
          console.error(
            `[tailor] Bullet rewrite failed for "${bullet.slice(0, 40)}...":`,
            err
          );
          // Fallback: return original bullet unchanged
          rewrittenBullets.push({
            original: bullet,
            tailored: bullet,
            changeReason: "Rewrite failed — using original",
            keywordsAddressed: [],
            confidence: "low" as const,
            riskFlag: "Rewrite failed. Please verify this bullet manually.",
          });
        }

        // Small delay between calls
        await sleep(INTER_CALL_DELAY_MS);
      }

      tailoredExperience.push({
        company: exp.company,
        title: exp.title,
        bullets: rewrittenBullets,
      });
    }

    // Generate tailored summary (simple heuristic for now)
    const tailoredSummary = resume.summary || generateFallbackSummary(resume, jd);

    // Merge skills: prioritize JD-aligned skills from resume
    const tailoredSkills = mergeSkills(
      resume.skills,
      jd.requiredSkills,
      jd.preferredSkills
    );

    const result = {
      tailoredSummary,
      tailoredSkills,
      tailoredExperience,
    };

    console.log(
      `[tailor] Complete — ${tailoredExperience.reduce((sum, e) => sum + e.bullets.length, 0)} bullets processed`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[tailor] Error:", error);
    const message =
      error instanceof Error ? error.message : "Tailoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateFallbackSummary(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): string {
  const name = resume.contact.name;
  const skills = resume.skills.slice(0, 4).join(", ") || "various technologies";
  return `${name} — professional with experience in ${skills}. Seeking ${jd.jobTitle} at ${jd.company}.`;
}

function mergeSkills(
  resumeSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): string[] {
  const resumeLower = new Set(resumeSkills.map((s) => s.toLowerCase()));

  // JD skills that match resume (prioritized: required first, then preferred)
  const jdMatched: string[] = [];
  for (const skill of [...requiredSkills, ...preferredSkills]) {
    if (resumeLower.has(skill.toLowerCase()) && !jdMatched.includes(skill)) {
      jdMatched.push(skill);
    }
  }

  // Remaining resume skills not already in the list
  const remaining = resumeSkills.filter((s) => !jdMatched.includes(s));

  return [...jdMatched, ...remaining];
}
