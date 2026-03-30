import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MessageSquare, ClipboardList, BarChart2, TrendingUp, Target, Users } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { REGIONS } from '@/types';
import { pct } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatProgress } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, SkeletonCard } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, interviews, surveys, loading, loadProject, getDashboardStats } = useProjectStore();

  useEffect(() => {
    if (id) loadProject(id);
  }, [id, loadProject]);

  const stats = getDashboardStats();
  const total = stats.totalInterviews + stats.totalSurveys;

  if (loading) {
    return (
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map((k) => <SkeletonCard key={k} />)}
      </div>
    );
  }

  if (!current) return null;

  const recentActivity = [
    ...interviews.slice(0, 5).map((i) => ({
      type: 'interview' as const,
      label: `Interview: ${i.participant}`,
      sub: REGIONS.find((r) => r.code === i.region)?.label ?? i.region,
      ts: i.interviewed_at,
    })),
    ...surveys.slice(0, 5).map((s) => ({
      type: 'survey' as const,
      label: 'Survey response',
      sub: REGIONS.find((r) => r.code === s.region)?.label ?? (s.region ?? 'Unknown'),
      ts: s.submitted_at,
    })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 8);

  const regionData = Object.entries(stats.regionBreakdown)
    .map(([code, count]) => ({
      name: REGIONS.find((r) => r.code === code)?.label ?? code,
      count,
      flag: REGIONS.find((r) => r.code === code)?.flag ?? '🌐',
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const sampleQuotes = interviews.flatMap((i) => i.quotes).filter(Boolean).slice(0, 6);

  return (
    <div className="p-8">
      <PageHeader
        title={current.name}
        subtitle={current.description ?? 'Validation research dashboard'}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/p/${id}/analysis`)}>
              <BarChart2 size={14} /> AI Analysis
            </Button>
          </div>
        }
      />

      {total === 0 && (
        <div className="bg-[rgba(59,130,246,.06)] border border-[rgba(59,130,246,.2)] rounded-xl px-4 py-3 mb-6 text-[13px] text-[var(--text2)]">
          <strong className="text-[var(--text)]">Get started:</strong> Add survey questions, share the survey link, and log interviews to populate your dashboard.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Interviews"
          value={stats.totalInterviews}
          target={current.target_interviews}
          icon={<ClipboardList size={16} />}
          accent="blue"
          color="linear-gradient(90deg,var(--accent),var(--accent2))"
        />
        <StatCard
          label="Survey Responses"
          value={stats.totalSurveys}
          target={current.target_surveys}
          icon={<MessageSquare size={16} />}
          accent="green"
          color="linear-gradient(90deg,var(--green),#34d399)"
        />
        <StatCard
          label="Strong Pain Signal"
          value={stats.strongPainPct}
          unit="%"
          icon={<TrendingUp size={16} />}
          accent="yellow"
          color="linear-gradient(90deg,var(--yellow),#fbbf24)"
          description="Avg pain score ≥7"
        />
        <StatCard
          label="Concept Interest"
          value={stats.conceptInterestPct}
          unit="%"
          icon={<Target size={16} />}
          accent="purple"
          color="linear-gradient(90deg,var(--accent3),#a78bfa)"
          description="Want a solution"
        />
        <StatCard
          label="Pilot-Ready Leads"
          value={stats.pilotReadyCount}
          icon={<Users size={16} />}
          accent="orange"
          color="linear-gradient(90deg,var(--orange),#fb923c)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Pain chart */}
        <Card>
          <CardTitle>🔥 Pain Point Severity</CardTitle>
          {stats.painAverages.length === 0 ? (
            <EmptyState icon="📊" title="No pain data yet" description="Log interviews with pain ratings to see this chart." className="py-8" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.painAverages} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--text3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fill: 'var(--text2)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text)' }}
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

        {/* Region breakdown */}
        <Card>
          <CardTitle>🌍 Region Breakdown</CardTitle>
          {regionData.length === 0 ? (
            <EmptyState icon="🗺️" title="No region data yet" className="py-8" />
          ) : (
            <div className="flex flex-col gap-3">
              {regionData.map((r) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">{r.flag}</span>
                  <span className="text-[12px] text-[var(--text2)] w-28 flex-shrink-0">{r.name}</span>
                  <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct(r.count, total)}%`,
                        background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
                      }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--text)] w-8 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <CardTitle>📋 Recent Activity</CardTitle>
          {recentActivity.length === 0 ? (
            <EmptyState icon="📭" title="No activity yet" className="py-8" />
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.type === 'interview' ? 'bg-[var(--accent)]' : 'bg-[var(--green)]'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium">{a.label}</span>
                    <span className="text-[11px] text-[var(--text3)] ml-1.5">{a.sub}</span>
                  </div>
                  <Badge variant={a.type === 'interview' ? 'blue' : 'green'} className="flex-shrink-0 text-[10px]">
                    {a.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quote bank */}
        <Card>
          <CardTitle>💬 Quote Bank</CardTitle>
          {sampleQuotes.length === 0 ? (
            <EmptyState icon="💭" title="No quotes yet" description="Add quotes when logging interviews." className="py-8" />
          ) : (
            <div className="flex flex-col gap-3">
              {sampleQuotes.map((q, i) => (
                <div key={i} className="relative bg-[rgba(59,130,246,.04)] border border-[rgba(59,130,246,.12)] rounded-xl p-3 pl-5">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] rounded-l-xl" />
                  <p className="text-[12px] text-[var(--text2)] italic leading-relaxed">"{q}"</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

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
  const progressVal = target ? pct(value, target) : value;
  return (
    <Card accent={accent}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider">{label}</div>
        <div className="text-[var(--text3)]">{icon}</div>
      </div>
      <div className="font-black text-[32px] leading-none mb-1">
        {value}{unit}
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
