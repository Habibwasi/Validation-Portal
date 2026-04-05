import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Project, Question, Interview, SurveyResponse, DashboardStats, Hypothesis } from '@/types';
import { avg, pct } from '@/lib/utils';

interface ProjectStore {
  current: Project | null;
  projects: Project[];
  questions: Question[];
  interviews: Interview[];
  surveys: SurveyResponse[];
  hypotheses: Hypothesis[];
  loading: boolean;

  setCurrent: (p: Project | null) => void;
  setProjects: (ps: Project[]) => void;
  setHypotheses: (hs: Hypothesis[]) => void;
  loadProject: (id: string) => Promise<void>;
  refreshDeps: (projectId: string) => Promise<void>;
  getDashboardStats: () => DashboardStats;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  current: null,
  projects: [],
  questions: [],
  interviews: [],
  surveys: [],
  hypotheses: [],
  loading: false,

  setCurrent: (p) => set({ current: p }),
  setProjects: (ps) => set({ projects: ps }),
  setHypotheses: (hs) => set({ hypotheses: hs }),

  loadProject: async (id) => {
    set({ loading: true });
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    if (data) set({ current: data });
    await get().refreshDeps(id);
    set({ loading: false });
  },

  refreshDeps: async (projectId) => {
    const [qRes, iRes, sRes, hRes] = await Promise.all([
      supabase.from('questions').select('*').eq('project_id', projectId).order('display_order'),
      supabase.from('interviews').select('*').eq('project_id', projectId).order('interviewed_at', { ascending: false }),
      supabase.from('survey_responses').select('*').eq('project_id', projectId).order('submitted_at', { ascending: false }),
      supabase.from('hypotheses').select('*').eq('project_id', projectId).order('display_order'),
    ]);
    set({
      questions: qRes.data ?? [],
      interviews: iRes.data ?? [],
      surveys: sRes.data ?? [],
      hypotheses: hRes.data ?? [],
    });
  },

  getDashboardStats: (): DashboardStats => {
    const { current, interviews, surveys, questions } = get();
    if (!current) return emptyStats();

    const settings = current.settings ?? {};

    // Pain signal: interviews where avg pain_score ≥ 7 OR survey concept ≥ 4
    const strongPainCount = interviews.filter((i) => {
      const scores = Object.values(i.pain_scores);
      if (!scores.length) return false;
      return avg(scores as number[]) >= 7;
    }).length;
    const strongPainPct = pct(strongPainCount, Math.max(interviews.length, 1));

    // Concept interest from surveys: look for a yes_no or scale question matching concept_question_id
    const conceptQid = settings.concept_question_id;
    let conceptCount = 0;
    if (conceptQid) {
      conceptCount = surveys.filter((s) => {
        const ans = s.answers[conceptQid];
        if (typeof ans === 'boolean') return ans;
        if (typeof ans === 'number') return ans >= 4;
        if (typeof ans === 'string') return ans.toLowerCase() === 'yes';
        return false;
      }).length;
    } else {
      // fallback: any yes_no question answered yes
      const ynQs = questions.filter((q) => q.type === 'yes_no');
      if (ynQs.length) {
        conceptCount = surveys.filter((s) =>
          ynQs.some((q) => {
            const a = s.answers[q.id];
            return a === true || a === 'yes' || a === 'Yes';
          }),
        ).length;
      }
    }
    const conceptInterestPct = pct(conceptCount, Math.max(surveys.length, 1));

    const pilotReadyCount = interviews.filter((i) => i.pilot_ready).length;

    // Pain averages across all scale/rating questions
    const scaleQs = questions.filter((q) => q.type === 'scale' || q.type === 'rating');
    const painAverages = scaleQs.map((q) => {
      const vals = interviews
        .map((i) => (i.pain_scores[q.id] as number | undefined))
        .filter((v): v is number => v != null);
      return { label: q.label, avg: avg(vals), count: vals.length };
    }).filter((p) => p.count > 0);

    return {
      totalInterviews: interviews.length,
      totalSurveys: surveys.length,
      strongPainPct,
      conceptInterestPct,
      pilotReadyCount,
      painAverages,
    };
  },
}));

function emptyStats(): DashboardStats {
  return {
    totalInterviews: 0,
    totalSurveys: 0,
    strongPainPct: 0,
    conceptInterestPct: 0,
    pilotReadyCount: 0,
    painAverages: [],
  };
}
