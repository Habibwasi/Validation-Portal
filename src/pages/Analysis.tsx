import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import { generateAnalysis } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, SkeletonCard } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, AlertTriangle } from 'lucide-react';

const VERDICT_META: Record<string, { label: string; color: string; badgeVariant: 'green' | 'yellow' | 'red' | 'blue' }> = {
  'Strong Signal': { label: 'Strong Signal', color: 'var(--green)', badgeVariant: 'green' },
  'Partial Signal': { label: 'Partial Signal', color: 'var(--yellow)', badgeVariant: 'yellow' },
  'Too Early': { label: 'Too Early', color: 'var(--accent)', badgeVariant: 'blue' },
  'No Signal': { label: 'No Signal', color: 'var(--red)', badgeVariant: 'red' },
};

const STRENGTH_META: Record<string, { variant: 'green' | 'yellow' | 'red'; label: string }> = {
  high: { variant: 'green', label: 'High' },
  medium: { variant: 'yellow', label: 'Medium' },
  low: { variant: 'red', label: 'Low' },
};

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const { current: project, interviews, surveys, getDashboardStats } = useProjectStore();

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setNoKey(true);
      setLoading(false);
      return;
    }
    loadCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCache = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('analysis_cache')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.result) {
      setResult(data.result as AnalysisResult);
      setCacheId(data.id);
    }
    setLoading(false);
  };

  const generate = async (regenerate = false) => {
    if (!project) return;

    if (regenerate && cacheId) {
      await supabase.from('analysis_cache').delete().eq('id', cacheId);
      setCacheId(null);
      setResult(null);
    }

    setGenerating(true);
    const stats = getDashboardStats();

    try {
      const analysis = await generateAnalysis(project.name, stats, interviews);
      setResult(analysis);

      const { data } = await supabase
        .from('analysis_cache')
        .insert({ project_id: project.id, result: analysis })
        .select('id')
        .single();

      if (data) setCacheId(data.id);
    } catch (err) {
      console.error(err);
      toast.error('AI analysis failed. Check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const totalData = interviews.length + surveys.length;
  const verdictMeta = result ? (VERDICT_META[result.verdict] ?? VERDICT_META['Too Early']) : null;

  const actions = (
    <div className="flex gap-2">
      {result && (
        <Button variant="ghost" size="sm" onClick={() => generate(true)} loading={generating}>
          <RefreshCw size={14} className="mr-1.5" />
          Regenerate
        </Button>
      )}
      {!result && !loading && (
        <Button variant="primary" onClick={() => generate(false)} loading={generating} disabled={totalData === 0 || noKey}>
          <Brain size={14} className="mr-1.5" />
          {generating ? 'Generating…' : 'Generate Insights'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto pb-16">
      <PageHeader
        title="AI Analysis"
        subtitle="LLM-powered signal validation based on your interviews and survey data"
        actions={actions}
      />

      {noKey && (
        <div className="bg-[rgba(234,179,8,.08)] border border-[rgba(234,179,8,.2)] rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle size={18} className="text-[var(--yellow)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[13px] text-[var(--yellow)] mb-1">OpenAI API key not configured</p>
            <p className="text-[12px] text-[var(--text2)]">
              Add <code className="bg-[var(--surface2)] px-1 py-0.5 rounded text-[11px]">VITE_OPENAI_API_KEY</code> to your <code className="bg-[var(--surface2)] px-1 py-0.5 rounded text-[11px]">.env</code> file and restart the dev server.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && !result && !generating && !noKey && (
        <EmptyState
          icon={<Brain size={32} />}
          title="No analysis yet"
          description={
            totalData === 0
              ? 'Log at least one interview or survey response before running analysis.'
              : `You have ${totalData} data point${totalData !== 1 ? 's' : ''}. Click "Generate Insights" to run AI analysis.`
          }
          action={
            totalData > 0
              ? <Button variant="primary" onClick={() => generate(false)}>Generate Insights</Button>
              : undefined
          }
        />
      )}

      {generating && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text2)] text-[13px]">Analysing {interviews.length} interview{interviews.length !== 1 ? 's' : ''} and {surveys.length} survey response{surveys.length !== 1 ? 's' : ''}…</p>
          <p className="text-[11px] text-[var(--text3)]">This typically takes 5–15 seconds.</p>
        </div>
      )}

      {result && verdictMeta && (
        <div className="space-y-6">

          {/* Verdict card */}
          <Card className="p-6" style={{ borderLeft: `4px solid ${verdictMeta.color}` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={verdictMeta.badgeVariant} size="lg">{verdictMeta.label}</Badge>
                  <span className="text-[11px] text-[var(--text3)]">{interviews.length} interviews · {surveys.length} survey responses</span>
                </div>
                <p className="text-[14px] text-[var(--text2)] leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </Card>

          {/* Themes */}
          {result.themes.length > 0 && (
            <section>
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Themes Identified</h2>
              <div className="space-y-3">
                {result.themes.map((theme, i) => {
                  const sm = STRENGTH_META[theme.strength ?? 'medium'] ?? STRENGTH_META.medium;
                  return (
                    <Card key={i} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-[14px]">{theme.title}</span>
                            <Badge variant={sm.variant} size="sm">{sm.label} strength</Badge>
                          </div>
                          <p className="text-[13px] text-[var(--text2)]">{theme.description}</p>
                        </div>
                        <div className="text-[11px] text-[var(--text3)] text-right flex-shrink-0">
                          {theme.strength} strength
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Key quotes */}
          {result.key_quotes.length > 0 && (
            <section>
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Key Quotes</h2>
              <div className="space-y-3">
                {result.key_quotes.map((quote, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-[var(--accent)] pl-4 py-1"
                  >
                    <p className="text-[13px] italic text-[var(--text2)]">"{quote}"</p>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next steps */}
            {result.next_steps.length > 0 && (
              <section>
                <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Next Steps</h2>
                <Card className="p-4">
                  <ol className="space-y-2">
                    {result.next_steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-[13px]">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-[var(--text2)]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </section>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <section>
                <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Watch Out For</h2>
                <Card className="p-4 bg-[rgba(234,179,8,.05)] border-[rgba(234,179,8,.15)]">
                  <ul className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2.5 text-[13px]">
                        <AlertTriangle size={14} className="text-[var(--yellow)] flex-shrink-0 mt-0.5" />
                        <span className="text-[var(--text2)]">{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--text3)]">
            Generated by gpt-4o-mini · Based on current project data · <button className="text-[var(--accent2)] hover:underline" onClick={() => generate(true)}>Regenerate</button>
          </p>
        </div>
      )}
    </div>
  );
}
