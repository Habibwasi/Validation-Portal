import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MessageSquare, ClipboardList, BarChart2, TrendingUp, Target, Users } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';
import { pct } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatProgress } from '@/components/ui/ProgressBar';
import { EmptyState, SkeletonCard } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { current, questions, loading, loadProject, refreshDeps, getDashboardStats } = useProjectStore();

  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (!current || current.id !== id) {
      loadProject(id);          // first load — shows skeleton
    } else {
      refreshDeps(id);          // already loaded — silent background refresh
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (location.state?.onboarding) {
      setShowWizard(true);
      // Clear the state so navigating back/forward doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map((k) => <SkeletonCard key={k} />)}
      </div>
    );
  }

  if (!current) return null;



  return (
    <>
    <div className="p-4 sm:p-8">
      <PageHeader
        title={current.name}
        subtitle={current.description ?? "Here's what your data says so far."}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/p/${id}/analysis`)}>
              <BarChart2 size={14} /> What does my data say?
            </Button>
          </div>
        }
      />

      {(stats.totalInterviews + stats.totalSurveys) === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: '📋',
              step: '01',
              title: 'Build your survey',
              description: 'Add questions to measure pain, enthusiasm, and willingness to pay.',
              cta: 'Open Survey Builder',
              href: `/p/${id}/survey`,
              accent: 'var(--accent)',
            },
            {
              icon: '🎙️',
              step: '02',
              title: 'Log a conversation',
              description: 'Record insights from customer interviews as you talk to real people.',
              cta: 'Add Interview',
              href: `/p/${id}/interviews`,
              accent: 'var(--green)',
            },
            {
              icon: '🤖',
              step: '03',
              title: 'Get your AI verdict',
              description: 'Once you have data, your AI-powered verdict will tell you what it means.',
              cta: 'View Analysis',
              href: `/p/${id}/analysis`,
              accent: 'var(--accent2)',
              dimmed: true,
            },
          ].map((card) => (
            <button
              key={card.step}
              onClick={() => navigate(card.href)}
              className={`group text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_var(--accent)] transition-all ${card.dimmed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span
                  className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: card.accent, background: `color-mix(in srgb, ${card.accent} 12%, transparent)` }}
                >
                  STEP {card.step}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-[var(--text)] mb-1">{card.title}</p>
              <p className="text-[12px] text-[var(--text2)] leading-relaxed mb-4">{card.description}</p>
              <span
                className="inline-flex items-center gap-1 text-[12px] font-medium"
                style={{ color: card.accent }}
              >
                {card.cta} →
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Conversations"
          value={stats.totalInterviews}
          target={current.target_interviews}
          icon={<ClipboardList size={16} />}
          accent="blue"
          color="linear-gradient(90deg,var(--accent),var(--accent2))"
        />
        <StatCard
          label="Survey Fills"
          value={stats.totalSurveys}
          target={current.target_surveys}
          icon={<MessageSquare size={16} />}
          accent="green"
          color="linear-gradient(90deg,var(--green),#34d399)"
        />
        <StatCard
          label="Feel the Pain"
          value={stats.strongPainPct}
          unit="%"
          icon={<TrendingUp size={16} />}
          accent="yellow"
          color="linear-gradient(90deg,var(--yellow),#fbbf24)"
          description="rated pain ≥7/10"
        />
        <StatCard
          label="Want a Solution"
          value={stats.conceptInterestPct}
          unit="%"
          icon={<Target size={16} />}
          accent="purple"
          color="linear-gradient(90deg,var(--accent3),#a78bfa)"
          description="said yes to your concept"
        />
        <StatCard
          label="Would Actually Use It"
          value={stats.pilotReadyCount}
          icon={<Users size={16} />}
          accent="orange"
          color="linear-gradient(90deg,var(--orange),#fb923c)"
        />
      </div>

      {stats.totalSurveys > 0 && stats.conceptInterestPct === 0 && !current.settings?.concept_question_id && (
        <div className="flex items-start gap-3 bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.3)] rounded-xl px-4 py-3 mb-6">
          <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-amber-400 mb-0.5">Analytics not set up</p>
            <p className="text-[12px] text-[var(--text2)]">
              Your stats show 0% because no survey questions are mapped to metrics yet. Fix it in{' '}
              <button
                onClick={() => navigate(`/p/${id}/settings`)}
                className="underline hover:text-amber-400 transition-colors"
              >
                Settings → Analytics
              </button>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Pain chart */}
        <Card>
          <CardTitle>🔥 How much does it hurt?</CardTitle>
          {stats.painAverages.length === 0 ? (
            <EmptyState icon="📊" title="No pain data yet" description="Talk to people first — log your first conversation to see pain scores here." className="py-8" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.painAverages} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--text3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fill: 'var(--text2)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                  formatter={(v) => [`${(v as number).toFixed(1)}/10`, 'Avg pain']}
                />
                <Bar dataKey="avg" radius={4} maxBarSize={18}>
                  {stats.painAverages.map((p, i) => (
                    <Cell key={i} fill={p.avg >= 7 ? 'var(--red)' : p.avg >= 5 ? 'var(--yellow)' : 'var(--green)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>

    {current && (
      <OnboardingWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        projectId={current.id}
        projectSlug={current.slug}
        projectName={current.name}
        hasQuestions={questions.length > 0}
      />
    )}
    </>
  );
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return display;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  target?: number;
  unit?: string;
  icon: React.ReactNode;
  accent: 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  color: string;
  description?: string;
}

function StatCard({ label, value, target, unit, icon, accent, color, description }: StatCardProps) {
  const displayed = useCountUp(Math.round(value));
  const progressVal = target ? pct(value, target) : value;
  return (
    <Card accent={accent}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider">{label}</div>
        <div className="text-[var(--text3)]">{icon}</div>
      </div>
      <div className="font-black text-[32px] leading-none mb-1 text-[var(--text)]">
        {displayed}{unit}
      </div>
      {description && <div className="text-[11px] text-[var(--text2)]">{description}</div>}
      {target && (
        <>
          <div className="text-[11px] text-[var(--text3)] mt-1">Target: {target}</div>
          <StatProgress value={progressVal} color={color} />
        </>
      )}
    </Card>
  );
}

