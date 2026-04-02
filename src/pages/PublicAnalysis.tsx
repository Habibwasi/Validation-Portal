import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

const VERDICT_META: Record<string, { label: string; color: string; badgeVariant: 'green' | 'yellow' | 'red' | 'blue' }> = {
  'Strong Signal':   { label: 'Strong Signal',   color: '#22c55e', badgeVariant: 'green' },
  'Partial Signal':  { label: 'Partial Signal',  color: '#eab308', badgeVariant: 'yellow' },
  'Too Early':       { label: 'Too Early',        color: '#f59e0b', badgeVariant: 'blue' },
  'No Signal':       { label: 'No Signal',        color: '#ef4444', badgeVariant: 'red' },
};

const STRENGTH_META: Record<string, { variant: 'green' | 'yellow' | 'red'; label: string }> = {
  high:   { variant: 'green',  label: 'High' },
  medium: { variant: 'yellow', label: 'Medium' },
  low:    { variant: 'red',    label: 'Low' },
};

export default function PublicAnalysis() {
  const { slug } = useParams<{ slug: string }>();
  const [projectName, setProjectName] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (projErr || !proj) { setNotFound(true); setLoading(false); return; }
      setProjectName(proj.name);

      const { data: cache } = await supabase
        .from('analysis_cache')
        .select('result')
        .eq('project_id', proj.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cache?.result) { setNotFound(true); setLoading(false); return; }
      setResult(cache.result as AnalysisResult);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-bold text-xl mb-2">No analysis found</h1>
          <p className="text-[var(--text2)] text-sm">This link may have expired or the analysis hasn't been run yet.</p>
        </div>
      </div>
    );
  }

  const verdictMeta = VERDICT_META[result.verdict] ?? VERDICT_META['Too Early'];

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[12px] font-semibold text-[var(--text3)] uppercase tracking-widest mb-1">Validation Report</div>
          <h1 className="font-black text-3xl text-[var(--text)]">{projectName}</h1>
          <p className="text-[13px] text-[var(--text3)] mt-2">Shared read-only view · Powered by Validate Portal</p>
        </div>

        {/* Verdict */}
        <Card className="p-6" style={{ borderLeft: `4px solid ${verdictMeta.color}` }}>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={verdictMeta.badgeVariant} size="lg">{verdictMeta.label}</Badge>
          </div>
          <p className="text-[14px] text-[var(--text2)] leading-relaxed">{result.summary}</p>
        </Card>

        {/* Themes */}
        {result.themes.length > 0 && (
          <section>
            <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Patterns we noticed</h2>
            <div className="space-y-3">
              {result.themes.map((theme, i) => {
                const sm = STRENGTH_META[theme.strength ?? 'medium'] ?? STRENGTH_META.medium;
                return (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-[14px]">{theme.title}</span>
                          <Badge variant={sm.variant} size="sm">{sm.label} strength</Badge>
                        </div>
                        <p className="text-[13px] text-[var(--text2)]">{theme.description}</p>
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
            <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">What people said</h2>
            <div className="space-y-3">
              {result.key_quotes.map((quote, i) => (
                <blockquote key={i} className="border-l-2 border-[var(--accent)] pl-4 py-1">
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
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">What to do next</h2>
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
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Things to watch out for</h2>
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

        <p className="text-center text-[11px] text-[var(--text3)] pt-4">
          Generated by <a href="/" className="text-[var(--accent)] hover:underline">Validate Portal</a>
        </p>
      </div>
    </div>
  );
}
