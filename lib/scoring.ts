import type {
  MatchScore,
  JobDescriptionProfile,
  TailoredExperienceEntry,
} from "@/types";

/**
 * Dynamically recalculates the tailored match score based on currently applied changes.
 *
 * Takes into account:
 * - Active bullets (tailored if confirmed or pending; original if reverted with confirmed === false)
 * - Keywords addressed by active tailored bullets
 * - Required skills evidenced in active bullets
 * - Responsibility alignment evidenced in active bullets
 *
 * Ensures deterministic, arithmetic-driven scoring that reacts dynamically
 * to user review actions (accepting/reverting bullets) without hardcoded variables.
 */
export function calculateDynamicScore(
  baseScore: MatchScore,
  jdProfile: JobDescriptionProfile,
  tailoredExperience: TailoredExperienceEntry[],
  resumeSkills: string[] = []
): MatchScore {
  const requiredSkills = Array.isArray(jdProfile.requiredSkills)
    ? jdProfile.requiredSkills
    : [];
  const totalRequired = Math.max(
    requiredSkills.length,
    baseScore.total_required_skills || 1
  );

  // 1. Gather active bullets and their text
  const activeBulletsText: string[] = [];
  const activeKeywords = new Set<string>();
  let totalBullets = 0;
  let activeChangedBullets = 0;

  for (const exp of tailoredExperience) {
    for (const b of exp.bullets) {
      totalBullets++;
      const isReverted = b.confirmed === false;
      const isChanged = b.original !== b.tailored;

      if (!isReverted && isChanged) {
        activeChangedBullets++;
        activeBulletsText.push(b.tailored.toLowerCase());
        (b.keywordsAddressed || []).forEach((kw) =>
          activeKeywords.add(kw.toLowerCase())
        );
      } else {
        activeBulletsText.push(b.original.toLowerCase());
      }
    }
  }

  // If all bullets are reverted (or no changes exist), return the base original score
  if (activeChangedBullets === 0 || totalBullets === 0) {
    return {
      ...baseScore,
      explanation: baseScore.explanation || "Original score (no changes applied).",
    };
  }

  const combinedActiveText = activeBulletsText.join(" ");
  const baseResumeSkillsLower = new Set(
    resumeSkills.map((s) => s.toLowerCase())
  );

  // 2. Calculate newly matched required skills
  let newlyMatchedCount = 0;
  const criticalMissingRemaining: string[] = [];

  for (const reqSkill of requiredSkills) {
    const skillLower = reqSkill.toLowerCase();
    const wasInBaseSkills = baseResumeSkillsLower.has(skillLower);

    // Check if substantiated in active tailored text or addressed keywords
    const isNowEvidenced =
      combinedActiveText.includes(skillLower) || activeKeywords.has(skillLower);

    if (!wasInBaseSkills && isNowEvidenced) {
      newlyMatchedCount++;
    } else if (!wasInBaseSkills && !isNowEvidenced) {
      criticalMissingRemaining.push(reqSkill);
    }
  }

  const baseMatched =
    baseScore.matched_skills ??
    Math.round((baseScore.skillCoverageScore / 100) * totalRequired);
  const matched_skills = Math.min(
    totalRequired,
    baseMatched + newlyMatchedCount
  );
  const skillCoverageScore = Math.min(
    100,
    Math.round((matched_skills / totalRequired) * 100)
  );

  // 3. Keyword score calculation
  const allJdKeywords = [
    ...(jdProfile.keywords || []),
    ...(jdProfile.tools || []),
    ...(jdProfile.preferredSkills || []),
  ];
  let matchedKeywordCount = 0;
  if (allJdKeywords.length > 0) {
    for (const kw of allJdKeywords) {
      const kwLower = kw.toLowerCase();
      if (
        combinedActiveText.includes(kwLower) ||
        activeKeywords.has(kwLower) ||
        baseResumeSkillsLower.has(kwLower)
      ) {
        matchedKeywordCount++;
      }
    }
  }
  const rawKeywordScore =
    allJdKeywords.length > 0
      ? Math.round((matchedKeywordCount / allJdKeywords.length) * 100)
      : baseScore.keywordScore;
  const keywordScore = Math.min(
    100,
    Math.max(baseScore.keywordScore, rawKeywordScore)
  );

  // 4. Responsibility alignment calculation
  const changeRatio = totalBullets > 0 ? activeChangedBullets / totalBullets : 0;
  const responsibilityGain = Math.round(changeRatio * 35); // up to +35 pts alignment
  const responsibilityAlignmentScore = Math.min(
    100,
    Math.round(baseScore.responsibilityAlignmentScore + responsibilityGain)
  );

  // 5. Seniority score
  const seniorityScore = baseScore.seniorityScore;

  // 6. Overall weighted score
  const overallScore = Math.min(
    100,
    Math.max(
      baseScore.overallScore,
      Math.round(
        skillCoverageScore * 0.4 +
          responsibilityAlignmentScore * 0.3 +
          keywordScore * 0.15 +
          seniorityScore * 0.15
      )
    )
  );

  const pointsImproved = overallScore - baseScore.overallScore;
  const explanation =
    pointsImproved > 0
      ? `Candidate matched ${matched_skills} of ${totalRequired} required skills (${skillCoverageScore}%). ` +
        `Tailored bullets improved keyword match to ${keywordScore}% and responsibility alignment to ${responsibilityAlignmentScore}%, ` +
        `yielding a +${pointsImproved} point improvement.`
      : baseScore.explanation;

  return {
    matched_skills,
    total_required_skills: totalRequired,
    overallScore,
    skillCoverageScore,
    responsibilityAlignmentScore,
    keywordScore,
    seniorityScore,
    criticalMissingRequirements: criticalMissingRemaining,
    explanation,
  };
}

