import type { DashboardStats, AnalysisResult, Interview } from '@/types';

function buildPrompt(
  projectName: string,
  stats: DashboardStats,
  interviews: Interview[],
): string {
  const painSummary = stats.painAverages
    .map((p) => `  - "${p.label}": avg ${p.avg.toFixed(1)}/10 (${p.count} data points)`)
    .join('\n');

  const regionSummary = Object.entries(stats.regionBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n');

  const sampleQuotes = interviews
    .flatMap((i) => i.quotes)
    .filter(Boolean)
    .slice(0, 12)
    .map((q) => `  - "${q}"`)
    .join('\n');

  const tags = interviews.flatMap((i) => i.tags);
  const tagFreq: Record<string, number> = {};
  tags.forEach((t) => { tagFreq[t] = (tagFreq[t] ?? 0) + 1; });
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t, c]) => `${t}(${c})`)
    .join(', ');

  return `You are a startup validation analyst. Analyse the following research data for the project "${projectName}" and return a structured JSON assessment.

## Data

Total interviews: ${stats.totalInterviews}
Total survey responses: ${stats.totalSurveys}
Strong pain signal: ${stats.strongPainPct.toFixed(0)}% of respondents
Concept interest: ${stats.conceptInterestPct.toFixed(0)}% want a solution
Pilot-ready leads: ${stats.pilotReadyCount}

Pain point averages (1–10 severity):
${painSummary || '  (no pain data yet)'}

Regional distribution:
${regionSummary || '  (no region data yet)'}

Most common tags: ${topTags || '(none)'}

Sample quotes from interviews:
${sampleQuotes || '  (no quotes yet)'}

## Instructions

Return ONLY valid JSON in this exact shape — no markdown, no explanation:

{
  "verdict": "Strong Signal" | "Partial Signal" | "Too Early" | "No Signal",
  "verdict_color": "green" | "yellow" | "orange" | "red",
  "summary": "2-3 sentence overall assessment",
  "themes": [
    {
      "title": "short theme name",
      "description": "1-2 sentences about this theme",
      "evidence": "specific numbers or quotes that support it",
      "strength": "high" | "medium" | "low"
    }
  ],
  "key_quotes": ["quote 1", "quote 2", "quote 3"],
  "next_steps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "warnings": ["risk or gap 1", "risk or gap 2"]
}

Rules:
- verdict "Strong Signal" requires ≥70% pain signal AND ≥60% concept interest AND ≥5 interviews
- verdict "Partial Signal" requires ≥50% pain signal OR ≥50% concept interest
- verdict "Too Early" if fewer than 5 total data points
- verdict "No Signal" if pain and interest are both low
- Include 2-4 themes, 2-4 key_quotes, 2-4 next_steps, 1-3 warnings
- Be brutally honest, do not hype findings
`;
}

export async function generateAnalysis(
  projectName: string,
  stats: DashboardStats,
  interviews: Interview[],
): Promise<AnalysisResult> {
  const prompt = buildPrompt(projectName, stats, interviews);

  const res = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<AnalysisResult>;
}
