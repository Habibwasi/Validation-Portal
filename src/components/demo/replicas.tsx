import type { CSSProperties, ReactNode } from 'react';
import {
  GripVertical, Trash2, Copy, ExternalLink, Wand2, Save, ShieldCheck, AlertTriangle, CheckCircle2, QrCode,
  Plus, ClipboardList, MessageSquare, TrendingUp, Target, Users, BarChart2, Edit2, CheckCircle, FlaskConical,
  ChevronDown, ChevronRight, Brain, RefreshCw, Download, Link2, Lightbulb, HelpCircle,
} from 'lucide-react';
import { cn, pct } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatProgress } from '@/components/ui/ProgressBar';
import { PageHead, Label } from './engine';
import { appear } from './motion';
import {
  PROJECT, DESC, SURVEY_URL, FIXED_LABEL, TYPE_META, H1, MAYA_QUOTE, MAYA_NOTES, ANALYSIS,
  Q_PAIN, Q_STORY, Q_FREQ, Q_MISSED, Q_TRIED, STATUS_META, STRENGTH, H2_TITLE, day,
  type Q, type IV, type Status,
} from './story';

// Static replicas of the real pages, driven by props instead of live data.

// ── Shared page pieces ───────────────────────────────────────────────────────

export function QuestionRow({ q, index, mom, style, fixedH }: {
  q: Q; index: number; mom?: 'good' | 'bad'; style?: CSSProperties; fixedH?: boolean;
}) {
  const meta = TYPE_META[q.type];
  const border = mom === 'bad' ? 'border-[rgba(239,68,68,.4)]' : mom === 'good' ? 'border-[rgba(34,197,94,.35)]' : 'border-[rgba(255,255,255,.04)]';
  return (
    <div className={cn('relative bg-[var(--surface)] border rounded-xl px-4 py-3', border, fixedH && 'h-[72px]')} style={style}>
      <div className="flex items-center gap-3">
        <div data-c={`grip-${q.id}`} className="text-[var(--text3)] flex-shrink-0"><GripVertical size={16} /></div>
        <div className="w-6 h-6 rounded-full bg-[var(--surface2)] text-[10px] font-bold text-[var(--text3)] flex items-center justify-center flex-shrink-0">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[13px] truncate">{q.label}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] text-[var(--text3)]">{meta.description}</span>
            <Badge variant={meta.color}>{meta.label}</Badge>
            <Badge variant="neutral">Required</Badge>
            {mom === 'good' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#22c55e] font-semibold"><CheckCircle2 size={11} /> Unbiased</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" data-c={`edit-${q.id}`}>Edit</Button>
          <Button size="sm" variant="ghost"><Trash2 size={13} /></Button>
        </div>
      </div>
      {mom === 'bad' && (
        <div className="mt-3 pt-3 border-t border-[rgba(239,68,68,.2)] space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-[#ef4444]" />
            <p className="text-[12px] font-medium leading-snug text-[#ef4444]">Hypothetical and pitches your solution — people say yes to be polite.</p>
          </div>
          <div className="ml-5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-1">Suggested rewrite</p>
            <p className="text-[12px] text-[var(--text2)] italic">&ldquo;{FIXED_LABEL}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SurveyPage({ rows, generating, checking, saving, dirty, momBanner, responses = 0, expanded }: {
  rows: { q: Q; mom?: 'good' | 'bad'; style?: CSSProperties; fixedH?: boolean }[];
  generating?: boolean; checking?: boolean; saving?: boolean; dirty?: boolean; momBanner?: boolean;
  responses?: number; expanded?: boolean;
}) {
  return (
    <div className="p-8">
      <PageHead
        title="Survey Builder"
        subtitle="Questions here become the public survey respondents fill out."
        actions={
          <>
            {rows.length > 0 && (
              <Button variant="secondary" loading={checking} data-c="bias">
                {!checking && <ShieldCheck size={15} />} {checking ? 'Checking…' : 'Check for bias'}
              </Button>
            )}
            <Button variant="secondary" loading={generating} data-c="gen">
              {!generating && <Wand2 size={15} />} {generating ? 'Generating…' : 'Generate with AI'}
            </Button>
            <Button variant={dirty ? 'primary' : 'secondary'} loading={saving} data-c="save">
              {!saving && <Save size={15} />} Save
            </Button>
            <Button variant="primary"><Plus size={15} /> Add question</Button>
          </>
        }
      />

      <Card className="mb-6 bg-[rgba(59,130,246,.04)] border-[rgba(59,130,246,.2)]">
        <CardTitle>🔗 Public Survey Link</CardTitle>
        <code className="block w-full text-[12px] font-mono text-[var(--accent2)] bg-[var(--surface2)] rounded-lg px-3 py-2 border border-[var(--border)] mb-3">
          {SURVEY_URL}
        </code>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" data-c="copy"><Copy size={13} /> Copy</Button>
          <Button size="sm" variant="secondary"><ExternalLink size={13} /> Preview</Button>
          <Button size="sm" variant="secondary" data-c="qr"><QrCode size={13} /> QR Code</Button>
        </div>
        <p className="text-[11px] text-[var(--text3)] mt-2">Anyone with this link can fill in the survey — no login required.</p>
      </Card>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-4xl mb-4 opacity-40">❓</div>
          <p className="font-semibold text-[var(--text)] mb-1">No questions yet</p>
          <p className="text-[12px] text-[var(--text3)] max-w-xs mb-4">Add your first question to build the survey respondents will see.</p>
          <Button variant="primary"><Plus size={14} /> Add question</Button>
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {dirty && (
            <div className="flex items-start gap-3 bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.3)] rounded-xl px-4 py-3">
              <span className="text-amber-400 flex-shrink-0">⚠️</span>
              <p className="text-[12px] text-amber-300 leading-relaxed">
                You have unsaved changes — questions won't update on the live survey until you press <strong>Save</strong>.
              </p>
            </div>
          )}
          <p className="text-[12px] text-[var(--text3)]">{rows.length} questions — drag to reorder</p>
          {momBanner && (
            <div className="flex items-start gap-2.5 bg-[rgba(99,102,241,.06)] border border-[rgba(99,102,241,.2)] rounded-xl px-4 py-3">
              <ShieldCheck size={14} className="text-[#818cf8] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-[#818cf8]">Bias check results</p>
                <p className="text-[11px] text-[var(--text3)] mt-0.5 leading-relaxed">
                  Based on <span className="text-[var(--text2)] font-medium">The Mom Test</span> — biased or leading questions make respondents give you the answer they think you want, not the truth.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => <QuestionRow key={r.q.id} q={r.q} index={i} mom={r.mom} style={r.style} fixedH={r.fixedH} />)}
      </div>

      <div className="mt-10">
        <h2 className="font-bold text-[15px]">Survey Responses</h2>
        <p className="text-[11px] text-[var(--text3)] mt-0.5 mb-4">{responses} response{responses !== 1 ? 's' : ''} collected</p>
        {responses === 0 ? (
          <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-5 py-8 text-center">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-[13px] text-[var(--text2)]">No responses yet — share the survey link above to start collecting.</p>
          </div>
        ) : (
          <div data-c="response-row" className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              {expanded ? <ChevronDown size={13} className="text-[var(--text3)]" /> : <ChevronRight size={13} className="text-[var(--text3)]" />}
              <div className="w-7 h-7 rounded-full bg-[rgba(6,182,212,.12)] text-[var(--accent2)] flex items-center justify-center text-[10px] font-bold">#</div>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-medium text-[13px]">{day(0)}</span>
                <span className="text-[11px] text-[var(--text3)]">5 answers</span>
              </div>
              <Button size="sm" variant="ghost"><Trash2 size={13} /></Button>
            </div>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                {([[Q_PAIN, '8'], [Q_STORY, 'Posted in the group chat and waited hours.'], [Q_FREQ, 'Weekly'], [Q_MISSED, 'Yes'], [Q_TRIED, 'No']] as const).map(([q, a]) => (
                  <div key={q.id} className="flex gap-3">
                    <span className="text-[11px] text-[var(--text3)] w-40 flex-shrink-0 truncate">{q.label}</span>
                    <span className="text-[12px] text-[var(--text)]">{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Stat({ label, value, unit, target, icon, accent, color, description }: {
  label: string; value: number; unit?: string; target?: number; icon: ReactNode;
  accent: 'blue' | 'green' | 'yellow' | 'purple' | 'orange'; color: string; description?: string;
}) {
  return (
    <Card accent={accent}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider">{label}</div>
        <div className="text-[var(--text3)]">{icon}</div>
      </div>
      <div className="font-black text-[32px] leading-none mb-1 text-[var(--text)]">{Math.round(value)}{unit}</div>
      {description && <div className="text-[11px] text-[var(--text2)]">{description}</div>}
      {target && (
        <>
          <div className="text-[11px] text-[var(--text3)] mt-1">Target: {target}</div>
          <StatProgress value={pct(value, target)} color={color} />
        </>
      )}
    </Card>
  );
}

export function DashboardPage({ conv, surveys, pain, concept, pilot, painAvg }: {
  conv: number; surveys: number; pain: number; concept: number; pilot: number; painAvg: number;
}) {
  const empty = conv + surveys === 0;
  return (
    <div className="p-8">
      <PageHead
        title={PROJECT}
        subtitle={DESC}
        actions={<Button size="sm" variant="secondary" data-c="data-say"><BarChart2 size={14} /> What does my data say?</Button>}
      />
      {empty && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: '📋', step: '01', title: 'Build your survey', description: 'Add questions to measure pain, enthusiasm, and willingness to pay.', cta: 'Open Survey Builder', accent: 'var(--accent)' },
            { icon: '🎙️', step: '02', title: 'Log a conversation', description: 'Record insights from customer interviews as you talk to real people.', cta: 'Add Interview', accent: 'var(--green)' },
            { icon: '🤖', step: '03', title: 'Get your AI verdict', description: 'Once you have data, your AI-powered verdict will tell you what it means.', cta: 'View Analysis', accent: 'var(--accent2)', dimmed: true },
          ].map((c) => (
            <div key={c.step} className={cn('bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5', c.dimmed && 'opacity-60')}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full" style={{ color: c.accent, background: `color-mix(in srgb, ${c.accent} 12%, transparent)` }}>STEP {c.step}</span>
              </div>
              <p className="text-[14px] font-semibold text-[var(--text)] mb-1">{c.title}</p>
              <p className="text-[12px] text-[var(--text2)] leading-relaxed mb-4">{c.description}</p>
              <span className="text-[12px] font-medium" style={{ color: c.accent }}>{c.cta} →</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Conversations" value={conv} target={15} icon={<ClipboardList size={16} />} accent="blue" color="linear-gradient(90deg,var(--accent),var(--accent2))" />
        <Stat label="Survey Fills" value={surveys} target={50} icon={<MessageSquare size={16} />} accent="green" color="linear-gradient(90deg,var(--green),#34d399)" />
        <Stat label="Feel the Pain" value={pain} unit="%" icon={<TrendingUp size={16} />} accent="yellow" color="" description="rated pain ≥7/10" />
        <Stat label="Want a Solution" value={concept} unit="%" icon={<Target size={16} />} accent="purple" color="" description="said yes to your concept" />
        <Stat label="Would Actually Use It" value={pilot} icon={<Users size={16} />} accent="orange" color="" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>🔥 How much does it hurt?</CardTitle>
          {painAvg === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="text-4xl mb-4 opacity-40">📊</div>
              <p className="font-semibold mb-1">No pain data yet</p>
              <p className="text-[12px] text-[var(--text3)] max-w-xs">Talk to people first — log your first conversation to see pain scores here.</p>
            </div>
          ) : (
            <div className="h-[150px] flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <div className="w-[160px] text-right text-[11px] text-[var(--text2)] leading-snug pr-1">{Q_PAIN.label}</div>
                <div className="flex-1 h-[18px]">
                  <div className="h-full rounded-[4px] bg-[var(--red)]" style={{ width: `${painAvg * 10}%` }} />
                </div>
              </div>
              <div className="flex ml-[168px] justify-between text-[11px] text-[var(--text3)] mt-3">
                {['0', '2.5', '5', '7.5', '10'].map((n) => <span key={n}>{n}</span>)}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function HypothesisCard({ n, h, status, linked, id, style }: {
  n: number; h: typeof H1; status: Status; linked: string[]; id: string; style?: CSSProperties;
}) {
  const sm = STATUS_META[status];
  return (
    <div style={style}>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--surface2)] text-[11px] font-bold text-[var(--text3)] flex items-center justify-center flex-shrink-0 mt-0.5">H{n}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] leading-relaxed text-[var(--text)] mb-2">
              I believe <span className="font-bold text-[var(--accent)]">{h.customer}</span> has <span className="font-bold">{h.problem}</span>
              {h.price && <> and will pay <span className="font-bold text-[var(--green)]">{h.price}</span></>} for <span className="font-bold text-[var(--accent2)]">{h.solution}</span>.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /><Badge variant={sm.variant} size="sm">{sm.label}</Badge></span>
              <span className="text-[11px] text-[var(--text3)]">Tested in {linked.length} conversation{linked.length !== 1 ? 's' : ''}</span>
            </div>
            {linked.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {linked.map((p) => (
                  <span key={p} className="text-[11px] bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-0.5 text-[var(--text2)]">{p}</span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text3)]">Status:</span>
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <span
                  key={s}
                  data-c={`st-${id}-${s}`}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-[11px] font-medium',
                    status === s ? 'bg-[var(--surface2)] border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text3)]',
                  )}
                >
                  {STATUS_META[s].label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost"><Edit2 size={13} /></Button>
            <Button size="sm" variant="ghost"><Trash2 size={13} /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function InterviewsHead({ tab, convCount, hypCount }: { tab: 'conversations' | 'hypotheses'; convCount: number; hypCount: number }) {
  const pill = (on: boolean) => cn(
    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold',
    on ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]' : 'text-[var(--text2)]',
  );
  return (
    <>
      <PageHead
        title="Conversations & Hypotheses"
        subtitle="Log who you talked to and track the assumptions you're testing"
        actions={tab === 'conversations'
          ? <Button variant="primary" data-c="add-conv"><Plus size={15} /> Add a conversation</Button>
          : <Button variant="primary" data-c="add-h"><Plus size={15} /> Add hypothesis</Button>}
      />
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-6">
        <span className={pill(tab === 'conversations')}>🎙️ Conversations <span className="opacity-70">({convCount})</span></span>
        <span data-c="tab-hyp" className={pill(tab === 'hypotheses')}>💡 Hypotheses <span className="opacity-70">({hypCount})</span></span>
      </div>
    </>
  );
}

export function HowItWorks() {
  return (
    <Card className="mb-6 bg-[rgba(245,158,11,.04)] border-[rgba(245,158,11,.2)]">
      <div className="flex items-start gap-3">
        <FlaskConical size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold mb-1">How it works</p>
          <p className="text-[12px] text-[var(--text2)] leading-relaxed">
            Write your core assumptions as structured hypotheses. When you log conversations, tag which hypotheses you tested. When you run AI analysis, it will assess each hypothesis individually — telling you whether the evidence supports or disproves it.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function InterviewRow({ iv, expanded, style, fixedH }: { iv: IV; expanded?: boolean; style?: CSSProperties; fixedH?: boolean }) {
  const color = iv.avg >= 7 ? 'text-[var(--red)]' : iv.avg >= 5 ? 'text-[var(--yellow)]' : 'text-[var(--green)]';
  return (
    <div data-c={`row-${iv.id}`} className={cn('bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3', fixedH && 'h-[64px]')} style={style}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,.15)] text-[var(--accent)] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
          {iv.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px]">{iv.name}</span>
            {iv.pilot && <Badge variant="green" className="flex items-center gap-1"><CheckCircle size={10} /> Would use it</Badge>}
            {iv.h?.map((h) => (
              <span key={h} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(245,158,11,.12)] text-[var(--accent)] border border-[rgba(245,158,11,.2)]">{h}</span>
            ))}
          </div>
          <div className="text-[11px] text-[var(--text3)] mt-0.5">
            {iv.date}<span className="ml-2">{iv.tags.slice(0, 3).join(' · ')}</span>
          </div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className={`font-black text-[18px] leading-tight ${color}`}>{iv.avg.toFixed(1)}</div>
          <div className="text-[10px] text-[var(--text3)]">pain avg</div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost"><Edit2 size={13} /></Button>
          <Button size="sm" variant="ghost"><Trash2 size={13} /></Button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Quotes</div>
            <div className="text-[12px] text-[var(--text2)] italic pl-3 border-l-2 border-[var(--accent)]">"{MAYA_QUOTE}"</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Notes</div>
            <p className="text-[12px] text-[var(--text2)]">{MAYA_NOTES}</p>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Pain Scores</div>
            <span className="bg-[var(--surface2)] rounded-lg px-2.5 py-1 text-[11px]">
              <span className="text-[var(--text3)]">{Q_PAIN.label}</span><span className="ml-1.5 font-bold text-[var(--red)]">9/10</span>
            </span>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Hypotheses tested</div>
            <div className="bg-[var(--surface2)] rounded-xl px-3 py-2.5 flex items-start gap-2.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(245,158,11,.12)] text-[var(--accent)] border border-[rgba(245,158,11,.2)]">H1</span>
              <div className="flex-1">
                <p className="text-[12px] leading-snug"><span className="font-semibold">{H1.customer}</span><span className="text-[var(--text3)]"> · </span>{H1.problem}<span className="text-[var(--green)]"> · {H1.price}</span></p>
                <p className="text-[11px] text-[var(--text3)] mt-0.5">{H1.solution}</p>
              </div>
              <span className="text-[10px] font-semibold text-[var(--text3)]">Untested</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SortTabs({ sort }: { sort: 'date' | 'pain' }) {
  return (
    <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-4">
      {([['date', 'Newest first'], ['pain', 'Highest pain']] as const).map(([v, l]) => (
        <span
          key={v}
          data-c={`sort-${v}`}
          className={cn('px-4 py-1.5 rounded-lg text-[12px] font-semibold', sort === v
            ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]'
            : 'text-[var(--text2)]')}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export function SelectBox({ label, hint, value, c, focused }: { label: string; hint?: string; value: string; c?: string; focused?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div
        data-c={c}
        className={cn('bg-[var(--surface2)] border rounded-lg px-3 py-[9px] text-[13px] flex items-center justify-between gap-2',
          focused ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(245,158,11,.15)]' : 'border-[var(--border)]')}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className="text-[var(--text3)] flex-shrink-0" />
      </div>
      {hint && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
    </div>
  );
}

// ── Analysis pieces ──────────────────────────────────────────────────────────

export function VerdictCard({ counts }: { counts: boolean }) {
  return (
    <Card className="p-6" style={{ borderLeft: '4px solid var(--green)' }}>
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="green" size="lg">Strong Signal</Badge>
        {counts && <span className="text-[11px] text-[var(--text3)]">12 interviews · 47 survey responses</span>}
      </div>
      <p className="text-[14px] text-[var(--text2)] leading-relaxed">{ANALYSIS.summary}</p>
    </Card>
  );
}

export function AnalysisBody({ t, from, publicView }: { t: number; from: number; publicView?: boolean }) {
  const a = (i: number) => appear(t, from + i * 0.22);
  return (
    <div className="space-y-6">
      <div style={a(0)}><VerdictCard counts={!publicView} /></div>
      <section>
        <h2 className={H2_TITLE} style={a(1)}>Patterns we noticed</h2>
        <div className="space-y-3">
          {ANALYSIS.themes.map((th, i) => (
            <div key={th.title} style={a(2 + i)}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-[14px]">{th.title}</span>
                      <Badge variant={STRENGTH[th.strength].variant} size="sm">{STRENGTH[th.strength].label} strength</Badge>
                    </div>
                    <p className="text-[13px] text-[var(--text2)]">{th.description}</p>
                  </div>
                  {!publicView && <div className="text-[11px] text-[var(--text3)]">{th.strength} strength</div>}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>
      <section style={a(5)}>
        <h2 className={H2_TITLE}>What people said</h2>
        <div className="space-y-3">
          {ANALYSIS.quotes.map((q) => (
            <blockquote key={q} className="border-l-2 border-[var(--accent)] pl-4 py-1"><p className="text-[13px] italic text-[var(--text2)]">"{q}"</p></blockquote>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4" style={a(6)}>
        <section>
          <h2 className={H2_TITLE}>What to do next</h2>
          <Card className="p-4">
            <ol className="space-y-2">
              {ANALYSIS.next.map((s, i) => (
                <li key={s} className="flex gap-3 text-[13px]">
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold mt-0.5">{i + 1}</div>
                  <span className="text-[var(--text2)]">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>
        <section>
          <h2 className={H2_TITLE}>Things to watch out for</h2>
          <Card className="p-4 bg-[rgba(234,179,8,.05)] border-[rgba(234,179,8,.15)]">
            <ul className="space-y-2">
              {ANALYSIS.warnings.map((w) => (
                <li key={w} className="flex gap-2.5 text-[13px]"><AlertTriangle size={14} className="text-[var(--yellow)] flex-shrink-0 mt-0.5" /><span className="text-[var(--text2)]">{w}</span></li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}

export function HypothesisAssessment({ t, from, applying }: { t: number; from: number; applying: boolean }) {
  return (
    <section style={appear(t, from)} className="mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text3)]">Hypothesis assessment</h2>
        <Button variant="ghost" size="sm" loading={applying} data-c="apply">
          {!applying && <Lightbulb size={13} className="mr-1.5" />} Apply verdicts
        </Button>
      </div>
      <div className="space-y-3">
        <Card className="p-4 bg-[rgba(34,197,94,.04)] border-[rgba(34,197,94,.15)]">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5 text-[var(--green)]" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[var(--text3)]">H1</span>
                <span className="text-[13px] font-semibold">Supported</span>
                <span className="text-[11px] font-medium text-[var(--green)]">high confidence</span>
              </div>
              <p className="text-[11px] text-[var(--text3)] mb-1.5 italic">"{H1.customer} · {H1.problem} · {H1.price} · {H1.solution}"</p>
              <p className="text-[13px] text-[var(--text2)]">7 of the 9 linked conversations described the problem without prompting.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <HelpCircle size={17} className="flex-shrink-0 mt-0.5 text-[var(--text3)]" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[var(--text3)]">H2</span>
                <span className="text-[13px] font-semibold">Uncertain</span>
                <span className="text-[11px] font-medium text-[var(--text3)]">low confidence</span>
              </div>
              <p className="text-[13px] text-[var(--text2)]">Only 2 managers interviewed — not enough evidence either way.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function ResultsHead({ hasResult, generating }: { hasResult: boolean; generating?: boolean }) {
  return (
    <PageHead
      title="Your Results"
      subtitle="Based on everything you've collected so far — here's what the data is telling you."
      actions={hasResult ? (
        <>
          <Button variant="ghost" size="sm" data-c="share"><Link2 size={14} className="mr-1.5" /> Share</Button>
          <Button variant="ghost" size="sm" data-c="export"><Download size={14} className="mr-1.5" /> Export PDF</Button>
          <Button variant="ghost" size="sm"><RefreshCw size={14} className="mr-1.5" /> Run again</Button>
        </>
      ) : (
        <Button variant="primary" loading={generating} data-c="analyse">
          {!generating && <Brain size={14} className="mr-1.5" />} {generating ? 'Analysing…' : 'What does my data say?'}
        </Button>
      )}
    />
  );
}
