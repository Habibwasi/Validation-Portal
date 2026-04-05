import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import type { Interview } from '@/types';
import { REGIONS } from '@/types';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, SkeletonRow } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const interviewSchema = z.object({
  participant:    z.string().min(1, 'Participant name required'),
  region:         z.string().min(1, 'Select a region'),
  interviewed_at: z.string().min(1, 'Date required'),
  pilot_ready:    z.boolean(),
  notes:          z.string().optional(),
  quotes:         z.array(z.object({ text: z.string() })),
  tags_raw:       z.string().optional(), // comma-separated
  pain_scores:    z.record(z.string(), z.number()),
  hypothesis_ids: z.array(z.string()),
});
type IForm = z.infer<typeof interviewSchema>;

export default function Interviews() {
  const { id } = useParams<{ id: string }>();
  const { questions, interviews, hypotheses, loading, refreshDeps } = useProjectStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Interview | null>(null);
  const [delTarget, setDelTarget] = useState<Interview | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sort, setSort] = useState<'date' | 'pain'>('date');

  const painQuestions = questions.filter((q) => q.type === 'rating' || q.type === 'scale');

  const sorted = [...interviews].sort((a, b) => {
    if (sort === 'pain') {
      const aVals = Object.values(a.pain_scores) as number[];
      const bVals = Object.values(b.pain_scores) as number[];
      const aAvg = aVals.length ? aVals.reduce((x, y) => x + y, 0) / aVals.length : 0;
      const bAvg = bVals.length ? bVals.reduce((x, y) => x + y, 0) / bVals.length : 0;
      return bAvg - aAvg;
    }
    return new Date(b.interviewed_at).getTime() - new Date(a.interviewed_at).getTime();
  });

  const openAdd = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (i: Interview) => { setEditTarget(i); setFormOpen(true); };

  const onSave = async (data: IForm) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const tags = data.tags_raw?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    const quotes = data.quotes.map((q) => q.text).filter(Boolean);
    const payload = {
      project_id: id,
      user_id: user!.id,
      participant: data.participant,
      region: data.region,
      interviewed_at: data.interviewed_at,
      pilot_ready: data.pilot_ready,
      notes: data.notes ?? null,
      quotes,
      tags,
      pain_scores: data.pain_scores,
      hypothesis_ids: data.hypothesis_ids ?? [],
    };

    if (editTarget) {
      const { error } = await supabase.from('interviews').update(payload).eq('id', editTarget.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('interviews').insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    await refreshDeps(id!);
    setSaving(false);
    setFormOpen(false);
    setEditTarget(null);
    toast.success(editTarget ? 'Updated!' : 'Nice, conversation saved!');
  };

  const onDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    await supabase.from('interviews').delete().eq('id', delTarget.id);
    await refreshDeps(id!);
    setDeleting(false);
    setDelTarget(null);
    toast.success('Removed');
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Your Conversations"
        subtitle={`${interviews.length} conversation${interviews.length !== 1 ? 's' : ''} logged so far`}
        actions={
          <Button variant="primary" onClick={openAdd}>
            <Plus size={15} /> Add a conversation
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((k) => <SkeletonRow key={k} />)}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title="You haven't talked to anyone yet"
          description="That's step 1 — find 3 people who might have the problem you're solving and talk to them."
          action={<Button variant="primary" onClick={openAdd}><Plus size={14} /> Log my first conversation</Button>}
        />
      ) : (
        <>
          <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-4">
            {([['date', 'Newest first'], ['pain', 'Highest pain']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  sort === val
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]'
                    : 'text-[var(--text2)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {sorted.map((interview) => (
              <InterviewRow
                key={interview.id}
                interview={interview}
                onEdit={() => openEdit(interview)}
                onDelete={() => setDelTarget(interview)}
              />
            ))}
          </div>
        </>
      )}

      <InterviewModal
        open={formOpen}
        initial={editTarget}
        painQuestions={painQuestions.map((q) => ({ id: q.id, label: q.label }))}
        hypotheses={hypotheses.map((h, i) => ({ id: h.id, index: i, customer: h.customer, problem: h.problem }))}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={onSave}
        saving={saving}
      />

      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={onDelete}
        title="Remove this conversation?"
        message={`This will remove the conversation with "${delTarget?.participant}". This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

// ── Interview Row ────────────────────────────────────────────────────────────

function InterviewRow({ interview: i, onEdit, onDelete }: {
  interview: Interview; onEdit: () => void; onDelete: () => void;
}) {
  const { questions, hypotheses } = useProjectStore();
  const questionLabels = Object.fromEntries(questions.map((q) => [q.id, q.label]));
  const region = REGIONS.find((r) => r.code === i.region);
  const scores = Object.values(i.pain_scores) as number[];
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3 group hover:border-[rgba(245,158,11,.2)] transition-all">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,.15)] text-[var(--accent)] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
          {i.participant.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px]">{i.participant}</span>
            {region && (
              <span className="text-[12px] text-[var(--text2)]">{region.flag} {region.label}</span>
            )}
            {i.pilot_ready && (
              <Badge variant="green" className="flex items-center gap-1">
                <CheckCircle size={10} /> Would use it
              </Badge>
            )}
            {(i.hypothesis_ids ?? []).map((hId) => {
              const hIdx = hypotheses.findIndex((h) => h.id === hId);
              return hIdx >= 0 ? (
                <span key={hId} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(245,158,11,.12)] text-[var(--accent)] border border-[rgba(245,158,11,.2)]">
                  H{hIdx + 1}
                </span>
              ) : null;
            })}
          </div>
          <div className="text-[11px] text-[var(--text3)] mt-0.5">
            {formatDate(i.interviewed_at)}
            {i.tags.length > 0 && (
              <span className="ml-2">{i.tags.slice(0,3).join(' · ')}</span>
            )}
          </div>
        </div>

        {avgScore && (
          <div className={`text-center flex-shrink-0`}>
            <div className={`font-black text-[18px] ${parseFloat(avgScore) >= 7 ? 'text-[var(--red)]' : parseFloat(avgScore) >= 5 ? 'text-[var(--yellow)]' : 'text-[var(--green)]'}`}>
              {avgScore}
            </div>
            <div className="text-[10px] text-[var(--text3)]">pain avg</div>
          </div>
        )}

        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit2 size={13} />
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="hover:text-[var(--red)]">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-3">
          {i.quotes.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Quotes</div>
              {i.quotes.map((q, idx) => (
                <div key={idx} className="text-[12px] text-[var(--text2)] italic mb-1.5 pl-3 border-l-2 border-[var(--accent)]">
                  "{q}"
                </div>
              ))}
            </div>
          )}
          {i.notes && (
            <div>
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Notes</div>
              <p className="text-[12px] text-[var(--text2)]">{i.notes}</p>
            </div>
          )}
          {Object.keys(i.pain_scores).length > 0 && (
            <div className="md:col-span-2">
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-2">Pain Scores</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(i.pain_scores).map(([qid, score]) => (
                  <div key={qid} className="bg-[var(--surface2)] rounded-lg px-2.5 py-1 text-[11px]">
                    <span className="text-[var(--text3)]">{questionLabels[qid] ?? qid}</span>
                    <span className={`ml-1.5 font-bold ${score as number >= 7 ? 'text-[var(--red)]' : 'text-[var(--yellow)]'}`}>
                      {score as number}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Interview Modal ──────────────────────────────────────────────────────────

interface IMProps {
  open: boolean;
  initial: Interview | null;
  painQuestions: { id: string; label: string }[];
  hypotheses: { id: string; index: number; customer: string; problem: string }[];
  onClose: () => void;
  onSave: (d: IForm) => Promise<void>;
  saving: boolean;
}

function InterviewModal({ open, initial, painQuestions, hypotheses, onClose, onSave, saving }: IMProps) {
  const [showPrompts, setShowPrompts] = useState(true);
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<IForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      participant: '', region: '', interviewed_at: new Date().toISOString().slice(0, 10),
      pilot_ready: false, notes: '', quotes: [], tags_raw: '', pain_scores: {}, hypothesis_ids: [],
    },
  });

  const watchedScores = watch('pain_scores');

  const { fields: quoteFields, append: addQuote, remove: removeQuote } = useFieldArray({
    control, name: 'quotes',
  });

  useEffect(() => {
    if (initial) {
      reset({
        participant: initial.participant,
        region: initial.region,
        interviewed_at: initial.interviewed_at.slice(0, 10),
        pilot_ready: initial.pilot_ready,
        notes: initial.notes ?? '',
        quotes: initial.quotes.map((t) => ({ text: t })),
        tags_raw: initial.tags.join(', '),
        pain_scores: initial.pain_scores as Record<string, number>,
        hypothesis_ids: initial.hypothesis_ids ?? [],
      });
    } else {
      reset({
        participant: '', region: '', interviewed_at: new Date().toISOString().slice(0, 10),
        pilot_ready: false, notes: '', quotes: [], tags_raw: '', pain_scores: {}, hypothesis_ids: [],
      });
    }
  }, [initial, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit conversation' : 'Log a conversation'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit(onSave)}>Save</Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSave)}>
        {/* Suggested questions */}
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPrompts((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--surface2)] text-[12px] font-semibold text-[var(--text2)] hover:text-[var(--text)] transition-colors"
          >
            <span>💡 Suggested questions to ask</span>
            {showPrompts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showPrompts && (
            <div className="px-4 py-3 flex flex-col gap-1.5 bg-[var(--surface)]">
              {[
                'Can you walk me through the last time this happened?',
                'What do you do today to deal with this problem?',
                'How much time / money does this cost you right now?',
                "What's the most frustrating part of your current solution?",
                'Have you ever tried to fix this? What stopped you?',
                'Who else in your life has this problem?',
                "If this problem disappeared tomorrow, what would change for you?",
                'Would you pay for something that solved this? What would feel fair?',
              ].map((q, i) => (
                <div key={i} className="flex gap-2 text-[12px] text-[var(--text2)]">
                  <span className="text-[var(--accent)] flex-shrink-0">→</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Who did you talk to?" placeholder="e.g. Ahmed D. (keep anonymous)" required
            hint="First name + initial is enough — no personal data needed"
            tooltip="A short anonymous identifier for this person. You'll see this name when reviewing interviews. No full names needed."
            error={errors.participant?.message} {...register('participant')} />
          <Select
            label="Region" required
            tooltip="Where this person is based. Used in the regional breakdown chart and helps the AI identify geographic patterns."
            placeholder="Select region"
            options={REGIONS.map((r) => ({ value: r.code, label: `${r.flag} ${r.label}` }))}
            error={errors.region?.message}
            {...register('region')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Interview date" type="date" required
            tooltip="When did this conversation happen? Used to track research velocity over time."
            error={errors.interviewed_at?.message} {...register('interviewed_at')} />
          <div className="flex flex-col gap-1.5 justify-end">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer py-2.5" title="Mark this person as a pilot-ready lead — someone who expressed strong interest and would likely use or pay for your solution. These are counted separately in the AI analysis.">
              <input type="checkbox" {...register('pilot_ready')} className="w-auto accent-[var(--green)]" />
              <CheckCircle size={14} className="text-[var(--green)]" />
              Would use it (pilot-ready)
            </label>
          </div>
        </div>

        {/* Pain scores */}
        {painQuestions.length > 0 && (
          <div>
            <div className="text-[13px] font-medium text-[var(--text)] mb-0.5 flex items-center">
              Pain scores
              <span className="relative group inline-flex items-center ml-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-[var(--text3)] text-[var(--text3)] text-[9px] font-bold flex items-center justify-center cursor-default select-none">?</span>
                <span className="pointer-events-none absolute top-full left-0 mt-1.5 w-64 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text2)] text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
                  Score each pain point 1–10 based on what this person said during the interview. 1 = barely a problem, 10 = extremely painful. Interviews where the average score ≥ 7 count as a strong pain signal in the AI analysis.
                </span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--accent2)] mb-2">⚡ These scores shape your AI verdict — rate honestly</p>
            <div className="flex flex-col gap-3">
              {painQuestions.map((q) => {
                const score = watchedScores?.[q.id];
                return (
                  <div key={q.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text2)] flex-1 min-w-0 truncate" title={q.label}>{q.label}</span>
                      <span className={`text-[13px] font-bold w-10 text-right tabular-nums flex-shrink-0 ${
                        score >= 7 ? 'text-[var(--red)]' : score >= 5 ? 'text-[var(--yellow)]' : score ? 'text-[var(--green)]' : 'text-[var(--text3)]'
                      }`}>{score ? `${score}/10` : '–'}</span>
                    </div>
                    <input
                      type="range" min="1" max="10" step="1"
                      className="w-full accent-[var(--accent)] h-1.5 cursor-pointer"
                      {...register(`pain_scores.${q.id}` as `pain_scores.${string}`, { valueAsNumber: true })}
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text3)]">
                      <span>1 — no problem</span>
                      <span>10 — unbearable</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quotes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="relative group inline-flex items-center text-[13px] font-medium text-[var(--text)]">
              Key quotes
              <span className="w-3.5 h-3.5 rounded-full border border-[var(--text3)] text-[var(--text3)] text-[9px] font-bold flex items-center justify-center cursor-default select-none ml-1.5">?</span>
              <span className="pointer-events-none absolute top-full left-0 mt-1.5 w-64 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text2)] text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
                Paste exact words the participant used. The AI picks the most compelling ones to include in the analysis report as supporting evidence.
              </span>
            </span>
            <Button size="sm" variant="ghost" type="button" onClick={() => addQuote({ text: '' })}>
              <Plus size={12} /> Add quote
            </Button>
          </div>
          {quoteFields.map((f, idx) => (
            <div key={f.id} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`Quote ${idx + 1}`}
                className="flex-1"
                {...register(`quotes.${idx}.text`)}
              />
              <Button size="sm" variant="ghost" type="button" onClick={() => removeQuote(idx)}
                className="hover:text-[var(--red)] flex-shrink-0">
                <XCircle size={14} />
              </Button>
            </div>
          ))}
          <p className="text-[11px] text-[var(--accent2)] mb-2">💬 Exact words carry more weight than your summary</p>
          {quoteFields.length === 0 && (
            <p className="text-[11px] text-[var(--text3)]">No quotes yet — even one sentence they said is incredibly useful.</p>
          )}
        </div>

        <Input
          label="Tags"
          tooltip="Comma-separated keywords that describe themes from this interview (e.g. cost, trust, speed). The AI shows the most frequent tags across all interviews to surface common patterns."
          placeholder="e.g. remittance, family-monitoring, pilot"
          hint="Comma-separated tags for filtering"
          {...register('tags_raw')}
        />

        {/* Hypothesis linking */}
        {hypotheses.length > 0 ? (
          <div>
            <div className="text-[13px] font-medium text-[var(--text)] mb-1.5">
              Which hypotheses did this test?
            </div>
            <div className="flex flex-col gap-2">
              {hypotheses.map((h) => (
                <label key={h.id} className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    value={h.id}
                    className="mt-0.5 accent-[var(--accent)]"
                    {...register('hypothesis_ids')}
                  />
                  <span className="text-[12px] text-[var(--text2)] leading-snug group-hover:text-[var(--text)] transition-colors">
                    <span className="text-[11px] font-bold text-[var(--accent)] mr-1.5">H{h.index + 1}</span>
                    {h.customer} · {h.problem}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-[var(--text3)] italic">
            You haven't added any hypotheses yet. Add them on the Hypotheses page to link them to conversations.
          </p>
        )}

        <Textarea label="Notes"
          tooltip="Private notes for yourself — follow-up questions, unusual context, or anything that doesn't fit elsewhere. These are not sent to the AI."
          placeholder="Additional observations, context, or follow-up items…"
          {...register('notes')} />
      </form>
    </Modal>
  );
}


