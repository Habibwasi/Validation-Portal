import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, Lightbulb, FlaskConical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import type { Hypothesis, HypothesisStatus } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const hSchema = z.object({
  customer: z.string().min(2, 'Describe the customer'),
  problem:  z.string().min(5, 'Describe the problem'),
  price:    z.string().optional(),
  solution: z.string().min(5, 'Describe the solution'),
  notes:    z.string().optional(),
});
type HForm = z.infer<typeof hSchema>;

const STATUS_META: Record<HypothesisStatus, { label: string; variant: 'neutral' | 'green' | 'red' | 'yellow'; dot: string }> = {
  untested:  { label: 'Untested',  variant: 'neutral', dot: 'bg-[var(--text3)]' },
  supported: { label: 'Supported', variant: 'green',   dot: 'bg-[var(--green)]' },
  disproved: { label: 'Disproved', variant: 'red',     dot: 'bg-[var(--red)]' },
  pivoted:   { label: 'Pivoted',   variant: 'yellow',  dot: 'bg-[var(--yellow)]' },
};

export default function Hypotheses() {
  const { id } = useParams<{ id: string }>();
  const { hypotheses, interviews, setHypotheses } = useProjectStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Hypothesis | null>(null);
  const [delTarget, setDelTarget] = useState<Hypothesis | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Count how many interviews are linked to each hypothesis
  const linkedCount = (hId: string) =>
    interviews.filter((i) => (i.hypothesis_ids ?? []).includes(hId)).length;

  const onSave = async (data: HForm) => {
    if (!id) return;
    setSaving(true);
    try {
      if (editTarget) {
        const { error } = await supabase
          .from('hypotheses')
          .update({
            customer: data.customer,
            problem: data.problem,
            price: data.price || null,
            solution: data.solution,
            notes: data.notes || null,
          })
          .eq('id', editTarget.id);
        if (error) throw error;
        setHypotheses(hypotheses.map((h) =>
          h.id === editTarget.id
            ? { ...h, customer: data.customer, problem: data.problem, price: data.price || null, solution: data.solution, notes: data.notes || null }
            : h
        ));
        toast.success('Hypothesis updated');
      } else {
        const maxOrder = hypotheses.reduce((m, h) => Math.max(m, h.display_order), -1);
        const { data: created, error } = await supabase
          .from('hypotheses')
          .insert({
            project_id: id,
            customer: data.customer,
            problem: data.problem,
            price: data.price || null,
            solution: data.solution,
            notes: data.notes || null,
            status: 'untested',
            display_order: maxOrder + 1,
          })
          .select()
          .single();
        if (error) throw error;
        setHypotheses([...hypotheses, created]);
        toast.success('Hypothesis added');
      }
    } catch {
      toast.error('Failed to save hypothesis');
    } finally {
      setSaving(false);
      setAddOpen(false);
      setEditTarget(null);
    }
  };

  const onDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    await supabase.from('hypotheses').delete().eq('id', delTarget.id);
    setHypotheses(hypotheses.filter((h) => h.id !== delTarget.id));
    setDeleting(false);
    setDelTarget(null);
    toast.success('Hypothesis removed');
  };

  const onStatusChange = async (h: Hypothesis, newStatus: HypothesisStatus) => {
    setUpdatingStatus(h.id);
    const { error } = await supabase.from('hypotheses').update({ status: newStatus }).eq('id', h.id);
    if (error) { toast.error('Failed to update status'); setUpdatingStatus(null); return; }
    setHypotheses(hypotheses.map((x) => x.id === h.id ? { ...x, status: newStatus } : x));
    setUpdatingStatus(null);
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Hypothesis Board"
        subtitle="Define your core assumptions before you validate. The AI will assess each one against your evidence."
        actions={
          <Button variant="primary" onClick={() => { setEditTarget(null); setAddOpen(true); }}>
            <Plus size={15} /> Add hypothesis
          </Button>
        }
      />

      {/* Explainer */}
      <Card className="mb-6 bg-[rgba(245,158,11,.04)] border-[rgba(245,158,11,.2)]">
        <div className="flex items-start gap-3">
          <FlaskConical size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[var(--text)] mb-1">How it works</p>
            <p className="text-[12px] text-[var(--text2)] leading-relaxed">
              Write your core assumptions as structured hypotheses. When you log interviews, tag which hypotheses you tested. When you run AI analysis, it will assess each hypothesis individually — telling you whether the evidence supports or disproves it, with a confidence level and reasoning.
            </p>
          </div>
        </div>
      </Card>

      {hypotheses.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={32} />}
          title="No hypotheses yet"
          description="Start by writing down your most important assumption — what must be true for this idea to work?"
          action={
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add my first hypothesis
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {hypotheses.map((h, i) => {
            const sm = STATUS_META[h.status];
            const count = linkedCount(h.id);
            return (
              <Card key={h.id} className="p-5 group">
                <div className="flex items-start gap-3">
                  {/* Index badge */}
                  <div className="w-7 h-7 rounded-full bg-[var(--surface2)] text-[11px] font-bold text-[var(--text3)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    H{i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Hypothesis sentence */}
                    <p className="text-[14px] leading-relaxed text-[var(--text)] mb-2">
                      I believe{' '}
                      <span className="font-bold text-[var(--accent)]">{h.customer}</span>{' '}
                      has{' '}
                      <span className="font-bold text-[var(--text)]">{h.problem}</span>
                      {h.price && (
                        <>
                          {' '}and will pay{' '}
                          <span className="font-bold text-[var(--green)]">{h.price}</span>
                        </>
                      )}
                      {' '}for{' '}
                      <span className="font-bold text-[var(--accent2)]">{h.solution}</span>.
                    </p>

                    {/* Notes */}
                    {h.notes && (
                      <p className="text-[12px] text-[var(--text3)] mb-2 italic">{h.notes}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        <Badge variant={sm.variant as 'neutral' | 'green' | 'red' | 'yellow'} size="sm">
                          {sm.label}
                        </Badge>
                      </span>

                      {/* Interview count */}
                      <span className="text-[11px] text-[var(--text3)]">
                        Tested in {count} interview{count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Status selector */}
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-[var(--text3)]">Status:</span>
                      {(['untested', 'supported', 'disproved', 'pivoted'] as HypothesisStatus[]).map((s) => {
                        const m = STATUS_META[s];
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={updatingStatus === h.id}
                            onClick={() => onStatusChange(h, s)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                              h.status === s
                                ? 'bg-[var(--surface2)] border-[var(--accent)] text-[var(--text)]'
                                : 'border-[var(--border)] text-[var(--text3)] hover:border-[var(--text3)]'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => { setEditTarget(h); setAddOpen(true); }}>
                      <Edit2 size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="hover:text-[var(--red)]" onClick={() => setDelTarget(h)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <HypothesisModal
        open={addOpen || !!editTarget}
        initial={editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        onSave={onSave}
        saving={saving}
        index={editTarget ? hypotheses.findIndex((h) => h.id === editTarget.id) : hypotheses.length}
      />

      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={onDelete}
        title="Remove this hypothesis?"
        message="This will permanently delete the hypothesis. Interview links will remain but the hypothesis label will no longer appear."
        loading={deleting}
      />
    </div>
  );
}

// ── Hypothesis Modal ─────────────────────────────────────────────────────────

interface HMProps {
  open: boolean;
  initial: Hypothesis | null;
  onClose: () => void;
  onSave: (data: HForm) => Promise<void>;
  saving: boolean;
  index: number;
}

function HypothesisModal({ open, initial, onClose, onSave, saving, index }: HMProps) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<HForm>({
    resolver: zodResolver(hSchema),
    defaultValues: { customer: '', problem: '', price: '', solution: '', notes: '' },
  });

  const customer = watch('customer');
  const problem  = watch('problem');
  const price    = watch('price');
  const solution = watch('solution');

  useEffect(() => {
    if (initial) {
      reset({
        customer: initial.customer,
        problem:  initial.problem,
        price:    initial.price ?? '',
        solution: initial.solution,
        notes:    initial.notes ?? '',
      });
    } else {
      reset({ customer: '', problem: '', price: '', solution: '', notes: '' });
    }
  }, [initial, open, reset]);

  const handleSave = handleSubmit(onSave);

  const preview =
    customer && problem && solution
      ? `I believe ${customer} has ${problem}${price ? ` and will pay ${price}` : ''} for ${solution}.`
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit H${index + 1}` : `Add hypothesis H${index + 1}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {initial ? 'Save changes' : 'Add hypothesis'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <p className="text-[12px] text-[var(--text3)]">
          Fill in the template below. The hypothesis sentence is built automatically from your inputs.
        </p>

        {/* Live preview */}
        {preview && (
          <div className="bg-[rgba(245,158,11,.06)] border border-[rgba(245,158,11,.2)] rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1">Preview</p>
            <p className="text-[13px] text-[var(--text)] leading-relaxed italic">"{preview}"</p>
          </div>
        )}

        <Input
          label="Customer"
          placeholder="e.g. parents living abroad"
          hint='Who has this problem? ("I believe ___")'
          required
          error={errors.customer?.message}
          {...register('customer')}
        />
        <Input
          label="Problem"
          placeholder="e.g. no easy way to check on elderly family members"
          hint='What pain do they have? ("has ___")'
          required
          error={errors.problem?.message}
          {...register('problem')}
        />
        <Input
          label="Price they'd pay"
          placeholder="e.g. £10–20/month"
          hint='Optional — omit if unknown ("and will pay ___")'
          {...register('price')}
        />
        <Input
          label="Solution"
          placeholder="e.g. a daily wellness check-in app"
          hint='What will solve it? ("for ___")'
          required
          error={errors.solution?.message}
          {...register('solution')}
        />
        <Textarea
          label="Notes"
          placeholder="Context, assumptions, or things that would change this hypothesis if proven wrong…"
          rows={2}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
