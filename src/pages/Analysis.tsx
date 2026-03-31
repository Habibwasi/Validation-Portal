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
import { EmptyState, SkeletonAnalysis } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, AlertTriangle, Download, Link2 } from 'lucide-react';

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
  const { current: project, interviews, surveys, questions, getDashboardStats } = useProjectStore();

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleExportPDF = () => {
    if (!result || !verdictMeta) return;

    const verdictColors: Record<string, string> = {
      'Strong Signal': '#16a34a',
      'Partial Signal': '#d97706',
      'Too Early': '#2563eb',
      'No Signal': '#dc2626',
    };
    const verdictColor = verdictColors[result.verdict] ?? '#888';
    const strengthColor = (s: string) => s === 'high' ? '#16a34a' : s === 'medium' ? '#d97706' : '#dc2626';
    const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const qLabel = (qid: string) => questions.find(q => q.id === qid)?.label ?? qid;

    const themesHtml = result.themes.map(t => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-weight:700;font-size:14px;color:#111;">${esc(t.title)}</span>
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;background:${strengthColor(t.strength)}22;color:${strengthColor(t.strength)};border:1px solid ${strengthColor(t.strength)}44;">${t.strength} strength</span>
        </div>
        <p style="font-size:13px;color:#555;line-height:1.6;">${esc(t.description)}</p>
      </div>`).join('');

    const quotesHtml = result.key_quotes.map(q => `
      <blockquote style="border-left:3px solid #f59e0b;padding-left:14px;margin:8px 0;font-style:italic;color:#555;font-size:13px;">"${esc(q)}"</blockquote>`).join('');

    const stepsHtml = result.next_steps.map((s, i) => `
      <li style="display:flex;gap:10px;margin-bottom:8px;font-size:13px;color:#333;list-style:none;">
        <span style="min-width:20px;height:20px;border-radius:50%;background:#f59e0b;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:2px;">${i + 1}</span>
        <span>${esc(s)}</span>
      </li>`).join('');

    const warningsHtml = result.warnings.map(w => `
      <li style="display:flex;gap:8px;margin-bottom:8px;font-size:13px;color:#333;list-style:none;">
        <span style="color:#d97706;flex-shrink:0;">&#9888;</span>
        <span>${esc(w)}</span>
      </li>`).join('');

    // ── Interviews ─────────────────────────────────────────────
    const interviewsHtml = interviews.length === 0
      ? '<p style="color:#999;font-size:13px;">No interviews recorded.</p>'
      : interviews.map((iv, idx) => {
          const date = new Date(iv.interviewed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
          const painRows = Object.entries(iv.pain_scores).map(([qid, score]) =>
            `<tr>
              <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px;">${esc(qLabel(qid))}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:700;font-size:12px;color:${Number(score) >= 7 ? '#dc2626' : Number(score) >= 4 ? '#d97706' : '#16a34a'};">${score}/10</td>
            </tr>`).join('');
          const quoteItems = (iv.quotes ?? []).filter(Boolean).map(q =>
            `<li style="list-style:none;padding:4px 0;border-bottom:1px solid #f9fafb;font-style:italic;font-size:12px;color:#555;">"${esc(q)}"</li>`).join('');
          const tagSpans = (iv.tags ?? []).map(t =>
            `<span style="display:inline-block;padding:2px 7px;border-radius:4px;font-size:11px;background:#f3f4f6;color:#555;margin-right:4px;margin-bottom:4px;">${esc(t)}</span>`).join('');
          return `
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;page-break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;flex-wrap:wrap;gap:4px;">
              <span style="font-weight:700;font-size:14px;color:#111;">${idx + 1}. ${esc(iv.participant || 'Anonymous')}</span>
              <span style="font-size:11px;color:#999;">${date}${iv.region ? ' · ' + esc(iv.region) : ''}${iv.pilot_ready ? ' · <strong style="color:#16a34a;">Pilot ready</strong>' : ''}</span>
            </div>
            ${tagSpans ? `<div style="margin-bottom:8px;">${tagSpans}</div>` : ''}
            ${painRows ? `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><thead><tr><th style="text-align:left;padding:5px 8px;font-size:11px;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;">Pain area</th><th style="text-align:center;padding:5px 8px;font-size:11px;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;">Score</th></tr></thead><tbody>${painRows}</tbody></table>` : ''}
            ${quoteItems ? `<div style="margin-bottom:8px;"><p style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Quotes</p><ul style="padding:0;margin:0;">${quoteItems}</ul></div>` : ''}
            ${iv.notes ? `<div style="background:#f9fafb;border-radius:6px;padding:10px;"><p style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Notes</p><p style="font-size:12px;color:#444;line-height:1.6;">${esc(iv.notes)}</p></div>` : ''}
          </div>`;
        }).join('');

    // ── Survey responses ───────────────────────────────────────
    const surveysHtml = surveys.length === 0
      ? '<p style="color:#999;font-size:13px;">No survey responses recorded.</p>'
      : surveys.map((sr, idx) => {
          const date = new Date(sr.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
          const answerRows = Object.entries(sr.answers).map(([qid, ans]) => {
            let display = '';
            if (Array.isArray(ans)) display = ans.map(String).join(', ');
            else if (typeof ans === 'boolean') display = ans ? 'Yes' : 'No';
            else display = String(ans ?? '—');
            return `<tr>
              <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;color:#555;font-size:12px;width:65%;">${esc(qLabel(qid))}</td>
              <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111;font-weight:500;">${esc(display)}</td>
            </tr>`;
          }).join('');
          return `
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:700;font-size:13px;color:#111;">Response #${idx + 1}</span>
              <span style="font-size:11px;color:#999;">${date}${sr.region ? ' · ' + esc(sr.region) : ''}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;"><tbody>${answerRows}</tbody></table>
          </div>`;
        }).join('');

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${esc(project?.name ?? 'Analysis')} — Validation Report</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 40px; max-width: 820px; margin: 0 auto; }
      h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #888; margin: 28px 0 10px; border-top: 1px solid #f3f4f6; padding-top: 14px; }
      .section-title { font-size: 17px; font-weight: 800; color: #111; margin: 44px 0 16px; padding-top: 24px; border-top: 2px solid #e5e7eb; }
      @media print { @page { margin: 15mm; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1 style="font-size:24px;font-weight:900;margin-bottom:4px;">${esc(project?.name ?? 'Validation Report')}</h1>
    <p style="font-size:12px;color:#999;margin-bottom:6px;">${esc(project?.description ?? '')}</p>
    <p style="font-size:11px;color:#bbb;margin-bottom:28px;">Generated ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} · ${interviews.length} interviews · ${surveys.length} survey responses</p>

    <p class="section-title" style="border-top:none;margin-top:0;">AI Analysis</p>

    <div style="border:1px solid #e5e7eb;border-left:4px solid ${verdictColor};border-radius:10px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;background:${verdictColor}22;color:${verdictColor};border:1px solid ${verdictColor}44;">${esc(result.verdict)}</span>
        <span style="font-size:11px;color:#999;">${interviews.length} interviews · ${surveys.length} survey responses</span>
      </div>
      <p style="font-size:14px;color:#444;line-height:1.65;">${esc(result.summary)}</p>
    </div>

    ${result.themes.length > 0 ? `<h2>Patterns we noticed</h2>${themesHtml}` : ''}
    ${result.key_quotes.length > 0 ? `<h2>What people said</h2>${quotesHtml}` : ''}
    ${result.next_steps.length > 0 ? `<h2>What to do next</h2><div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;"><ol style="padding:0;">${stepsHtml}</ol></div>` : ''}
    ${result.warnings.length > 0 ? `<h2>Things to watch out for</h2><div style="border:1px solid #fde68a;border-radius:8px;padding:14px;background:#fffbeb;"><ul style="padding:0;">${warningsHtml}</ul></div>` : ''}

    <p class="section-title">Interviews (${interviews.length})</p>
    ${interviewsHtml}

    <p class="section-title">Survey Responses (${surveys.length})</p>
    ${surveysHtml}

    <p style="margin-top:40px;text-align:center;font-size:11px;color:#bbb;">Generated by Validate Portal</p>
  </body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) { toast.error('Pop-up blocked — allow pop-ups and try again.'); URL.revokeObjectURL(url); return; }
    printWindow.addEventListener('load', () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    });
  };

  const handleCopyLink = () => {
    if (!project) return;
    const url = `${window.location.origin}/a/${project.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  const actions = (
    <div className="flex gap-2">
      {result && (
        <>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <Link2 size={14} className="mr-1.5" />
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportPDF}>
            <Download size={14} className="mr-1.5" />
            Export PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => generate(true)} loading={generating}>
            <RefreshCw size={14} className="mr-1.5" />
            Run again
          </Button>
        </>
      )}
      {!result && !loading && (
        <Button variant="primary" onClick={() => generate(false)} loading={generating} disabled={totalData === 0}>
          <Brain size={14} className="mr-1.5" />
          {generating ? 'Analysing…' : 'What does my data say?'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto pb-16">
      <PageHeader
        title="Your Results"
        subtitle="Based on everything you've collected so far — here's what the data is telling you."
        actions={actions}
      />

      {loading && <SkeletonAnalysis />}

      {!loading && !result && !generating && (
        <EmptyState
          icon={<Brain size={32} />}
          title="Nothing to analyse yet"
          description={
            totalData === 0
              ? 'Talk to at least one person or get one survey response first.'
              : `You've got ${totalData} data point${totalData !== 1 ? 's' : ''}. Ready to see what it means?`
          }
          action={
            totalData > 0
              ? <Button variant="primary" onClick={() => generate(false)}>What does my data say?</Button>
              : undefined
          }
        />
      )}

      {generating && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text2)] text-[13px]">Reading through your conversations and survey responses…</p>
          <p className="text-[11px] text-[var(--text3)]">This usually takes about 10 seconds.</p>
        </div>
      )}

      {result && verdictMeta && (
        <div id="analysis-print-area" className="space-y-6">

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
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">Patterns we noticed</h2>
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
              <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3">What people said</h2>
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

          <p className="text-center text-[11px] text-[var(--text3)] no-print">
            Powered by Groq AI · Based on your current data · <button className="text-[var(--accent2)] hover:underline" onClick={() => generate(true)}>Run again</button>
          </p>
        </div>
      )}
    </div>
  );
}
