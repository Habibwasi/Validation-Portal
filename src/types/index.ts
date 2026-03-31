// ─── Database types ────────────────────────────────────────────────────────

export type QuestionType = 'text' | 'long_text' | 'scale' | 'choice' | 'multi_choice' | 'yes_no' | 'rating';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string;
  target_interviews: number;
  target_surveys: number;
  archived: boolean;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettings {
  survey_welcome?: string;
  survey_thankyou?: string;
  pain_question_ids?: string[]; // question IDs treated as "pain" metrics
  concept_question_id?: string; // question ID used for concept interest %
  pilot_question_id?: string;   // question ID used for pilot-ready count
  enabled_languages?: string[]; // ISO codes of languages the survey is translated into
}

export interface Question {
  id: string;
  project_id: string;
  type: QuestionType;
  label: string;
  options: string[] | null; // for choice / multi_choice
  required: boolean;
  display_order: number;
  translations: Record<string, { label: string; options?: string[] }> | null;
  created_at: string;
}

export interface Interview {
  id: string;
  project_id: string;
  participant: string;
  region: RegionCode;
  interviewed_at: string;
  pain_scores: Record<string, number>; // question_id → 1-10
  quotes: string[];
  tags: string[];
  notes: string | null;
  pilot_ready: boolean;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  project_id: string;
  answers: Record<string, unknown>; // question_id → answer
  region: RegionCode | null;
  submitted_at: string;
}

export interface AnalysisCache {
  id: string;
  project_id: string;
  result: AnalysisResult;
  generated_at: string;
}

export interface AnalysisResult {
  verdict: 'Strong Signal' | 'Partial Signal' | 'Too Early' | 'No Signal';
  verdict_color: 'green' | 'yellow' | 'orange' | 'red';
  summary: string;
  themes: AnalysisTheme[];
  key_quotes: string[];
  next_steps: string[];
  warnings: string[];
}

export interface AnalysisTheme {
  title: string;
  description: string;
  evidence: string;
  strength: 'high' | 'medium' | 'low';
}

// ─── Region codes ──────────────────────────────────────────────────────────

export type RegionCode =
  | 'eu' | 'me' | 'na' | 'ap' | 'bd' | 'latam' | 'africa' | 'other';

export interface Region {
  code: RegionCode;
  label: string;
  flag: string;
}

export interface SupportedLanguage {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'ar', label: 'Arabic',  flag: '🇸🇦' },
  { code: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { code: 'fr', label: 'French',  flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳' },
  { code: 'da', label: 'Danish',  flag: '🇩🇰' },
  { code: 'de', label: 'German',  flag: '🇩🇪' },
];

export const REGIONS: Region[] = [
  { code: 'eu',     label: 'Europe',        flag: '🇪🇺' },
  { code: 'me',     label: 'Middle East',   flag: '🌙' },
  { code: 'na',     label: 'North America', flag: '🌎' },
  { code: 'ap',     label: 'Asia Pacific',  flag: '🌏' },
  { code: 'bd',     label: 'Bangladesh',    flag: '🇧🇩' },
  { code: 'latam',  label: 'Latin America', flag: '🌎' },
  { code: 'africa', label: 'Africa',        flag: '🌍' },
  { code: 'other',  label: 'Other',         flag: '🌐' },
];

// ─── UI helpers ────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalInterviews: number;
  totalSurveys: number;
  strongPainPct: number;
  conceptInterestPct: number;
  pilotReadyCount: number;
  regionBreakdown: Record<RegionCode, number>;
  painAverages: { label: string; avg: number; count: number }[];
}
