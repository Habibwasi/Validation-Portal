import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
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
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const interviewSchema = z.object({
  pseudonym:    z.string().min(1, 'Pseudonym required'),
  region:       z.string().min(1, 'Select a region'),
  conducted_at: z.string().min(1, 'Date required'),
  pilot_ready:  z.boolean(),
  notes:        z.string().optional(),
  quotes:       z.array(z.object({ text: z.string() })),
  tags_raw:     z.string().optional(), // comma-separated
  pain_scores:  z.record(z.string(), z.number()),
});
type IForm = z.infer<typeof interviewSchema>;

export default function Interviews() {
  const { id } = useParams<{ id: string }>();
  const { questions, interviews, refreshDeps } = useProjectStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Interview | null>(null);
  const [delTarget, setDelTarget] = useState<Interview | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const painQuestions = questions.filter((q) => q.type === 'rating' || q.type === 'scale');

  const openAdd = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (i: Interview) => { setEditTarget(i); setFormOpen(true); };

  const onSave = async (data: IForm) => {
    setSaving(true);
    const tags = data.tags_raw?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    const quotes = data.quotes.map((q) => q.text).filter(Boolean);
    const payload = {
      project_id: id,
      pseudonym: data.pseudonym,
      region: data.region,
      conducted_at: data.conducted_at,
      pilot_ready: data.pilot_ready,
      notes: data.notes ?? null,
      quotes,
      tags,
      pain_scores: data.pain_scores,
      raw_answers: {},
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
    toast.success(editTarget ? 'Interview updated' : 'Interview logged');
  };

  const onDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    await supabase.from('interviews').delete().eq('id', delTarget.id);
    await refreshDeps(id!);
    setDeleting(false);
    setDelTarget(null);
    toast.success('Interview removed');
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Interview Tracker"
        subtitle={`${interviews.length} interview${interviews.length !== 1 ? 's' : ''} logged`}
        actions={
          <Button variant="primary" onClick={openAdd}>
            <Plus size={15} /> Log interview
          </Button>
        }
      />

      {interviews.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title="No interviews logged yet"
          description="Log your first customer interview to start tracking pain signals and quotes."
          action={<Button variant="primary" onClick={openAdd}><Plus size={14} /> Log interview</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => (
            <InterviewRow
              key={interview.id}
              interview={interview}
              onEdit={() => openEdit(interview)}
              onDelete={() => setDelTarget(interview)}
            />
          ))}
        </div>
      )}

      <InterviewModal
        open={formOpen}
        initial={editTarget}
        painQuestions={painQuestions.map((q) => ({ id: q.id, label: q.label }))}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={onSave}
        saving={saving}
      />

      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={onDelete}
        title="Remove interview"
        message={`Remove the interview with "${delTarget?.pseudonym}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

// ── Interview Row ────────────────────────────────────────────────────────────

function InterviewRow({ interview: i, onEdit, onDelete }: {
  interview: Interview; onEdit: () => void; onDelete: () => void;
}) {
  const region = REGIONS.find((r) => r.code === i.region);
  const scores = Object.values(i.pain_scores) as number[];
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3 group hover:border-[rgba(59,130,246,.2)] transition-all">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[rgba(59,130,246,.15)] text-[var(--accent)] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
          {i.pseudonym.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px]">{i.pseudonym}</span>
            {region && (
              <span className="text-[12px] text-[var(--text2)]">{region.flag} {region.label}</span>
            )}
            {i.pilot_ready && (
              <Badge variant="green" className="flex items-center gap-1">
                <CheckCircle size={10} /> Pilot-ready
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-[var(--text3)] mt-0.5">
            {formatDate(i.conducted_at)}
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

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <span className="text-[var(--text3)]">{qid}</span>
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
  onClose: () => void;
  onSave: (d: IForm) => Promise<void>;
  saving: boolean;
}

function InterviewModal({ open, initial, painQuestions, onClose, onSave, saving }: IMProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<IForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      pseudonym: '', region: '', conducted_at: new Date().toISOString().slice(0, 10),
      pilot_ready: false, notes: '', quotes: [], tags_raw: '', pain_scores: {},
    },
  });

  const { fields: quoteFields, append: addQuote, remove: removeQuote } = useFieldArray({
    control, name: 'quotes',
  });

  useEffect(() => {
    if (initial) {
      reset({
        pseudonym: initial.pseudonym,
        region: initial.region,
        conducted_at: initial.conducted_at.slice(0, 10),
        pilot_ready: initial.pilot_ready,
        notes: initial.notes ?? '',
        quotes: initial.quotes.map((t) => ({ text: t })),
        tags_raw: initial.tags.join(', '),
        pain_scores: initial.pain_scores as Record<string, number>,
      });
    } else {
      reset({
        pseudonym: '', region: '', conducted_at: new Date().toISOString().slice(0, 10),
        pilot_ready: false, notes: '', quotes: [], tags_raw: '', pain_scores: {},
      });
    }
  }, [initial, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit interview' : 'Log interview'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit(onSave)}>Save interview</Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSave)}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Pseudonym" placeholder="e.g. Ahmed D." required
            error={errors.pseudonym?.message} {...register('pseudonym')} />
          <Select
            label="Region" required
            placeholder="Select region"
            options={REGIONS.map((r) => ({ value: r.code, label: `${r.flag} ${r.label}` }))}
            error={errors.region?.message}
            {...register('region')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date conducted" type="date" required
            error={errors.conducted_at?.message} {...register('conducted_at')} />
          <div className="flex flex-col gap-1.5 justify-end">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer py-2.5">
              <input type="checkbox" {...register('pilot_ready')} className="w-auto accent-[var(--green)]" />
              <CheckCircle size={14} className="text-[var(--green)]" />
              Pilot-ready lead
            </label>
          </div>
        </div>

        {/* Pain scores */}
        {painQuestions.length > 0 && (
          <div>
            <div className="text-[13px] font-medium text-[var(--text)] mb-2">
              Pain scores <span className="text-[var(--text3)] font-normal text-[11px]">(1 = low, 10 = extreme)</span>
            </div>
            <div className="flex flex-col gap-2">
              {painQuestions.map((q) => (
                <div key={q.id} className="flex items-center gap-3">
                  <span className="text-[12px] text-[var(--text2)] flex-1 min-w-0 truncate" title={q.label}>
                    {q.label}
                  </span>
                  <input
                    type="number" min={1} max={10}
                    className="w-20"
                    {...register(`pain_scores.${q.id}` as `pain_scores.${string}`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--text)]">Key quotes</span>
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
          {quoteFields.length === 0 && (
            <p className="text-[11px] text-[var(--text3)]">No quotes yet — direct quotes from interviewees are gold for your analysis.</p>
          )}
        </div>

        <Input
          label="Tags"
          placeholder="e.g. remittance, family-monitoring, pilot"
          hint="Comma-separated tags for filtering"
          {...register('tags_raw')}
        />

        <Textarea label="Notes" placeholder="Additional observations, context, or follow-up items…"
          {...register('notes')} />
      </form>
    </Modal>
  );
}


