// ΓöÇΓöÇΓöÇ Database types ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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
  pain_scores: Record<string, number>; // question_id ΓåÆ 1-10
  quotes: string[];
  tags: string[];
  notes: string | null;
  pilot_ready: boolean;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  project_id: string;
  answers: Record<string, unknown>; // question_id ΓåÆ answer
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

// ΓöÇΓöÇΓöÇ Region codes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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
  { code: 'ar', label: 'Arabic',  flag: '≡ƒç╕≡ƒçª' },
  { code: 'bn', label: 'Bengali', flag: '≡ƒçº≡ƒç⌐' },
  { code: 'fr', label: 'French',  flag: '≡ƒç½≡ƒç╖' },
  { code: 'es', label: 'Spanish', flag: '≡ƒç¬≡ƒç╕' },
  { code: 'tr', label: 'Turkish', flag: '≡ƒç╣≡ƒç╖' },
  { code: 'hi', label: 'Hindi',   flag: '≡ƒç«≡ƒç│' },
  { code: 'da', label: 'Danish',  flag: '≡ƒç⌐≡ƒç░' },
  { code: 'de', label: 'German',  flag: '≡ƒç⌐≡ƒç¬' },
];

export const REGIONS: Region[] = [
  { code: 'eu',     label: 'Europe',        flag: '≡ƒç¬≡ƒç║' },
  { code: 'me',     label: 'Middle East',   flag: '≡ƒîÖ' },
  { code: 'na',     label: 'North America', flag: '≡ƒîÄ' },
  { code: 'ap',     label: 'Asia Pacific',  flag: '≡ƒîÅ' },
  { code: 'bd',     label: 'Bangladesh',    flag: '≡ƒçº≡ƒç⌐' },
  { code: 'latam',  label: 'Latin America', flag: '≡ƒîÄ' },
  { code: 'africa', label: 'Africa',        flag: '≡ƒîì' },
  { code: 'other',  label: 'Other',         flag: '≡ƒîÉ' },
];

// ΓöÇΓöÇΓöÇ UI helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export interface DashboardStats {
  totalInterviews: number;
  totalSurveys: number;
  strongPainPct: number;
  conceptInterestPct: number;
  pilotReadyCount: number;
  regionBreakdown: Record<RegionCode, number>;
  painAverages: { label: string; avg: number; count: number }[];
}
