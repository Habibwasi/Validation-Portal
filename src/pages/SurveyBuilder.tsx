import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import type { Question, QuestionType } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'text',         label: 'Short text',      description: 'One-line answer' },
  { value: 'long_text',    label: 'Long text',        description: 'Multi-line answer' },
  { value: 'rating',       label: 'Pain rating 1–10', description: 'Measures pain severity' },
  { value: 'scale',        label: 'Scale 1–10',       description: 'General numeric scale' },
  { value: 'yes_no',       label: 'Yes / No',         description: 'Binary question' },
  { value: 'choice',       label: 'Single choice',    description: 'Pick one option' },
  { value: 'multi_choice', label: 'Multi choice',     description: 'Pick multiple options' },
];

const typeColors: Record<QuestionType, string> = {
  text:         'blue',
  long_text:    'blue',
  rating:       'red',
  scale:        'yellow',
  yes_no:       'green',
  choice:       'purple',
  multi_choice: 'purple',
};

const qSchema = z.object({
  type:     z.string(),
  label:    z.string().min(3, 'Question must be at least 3 characters'),
  required: z.boolean(),
  options:  z.string().optional(), // comma-separated for choice
});
type QForm = z.infer<typeof qSchema>;

export default function SurveyBuilder() {
  const { id } = useParams<{ id: string }>();
  const { current, questions, refreshDeps } = useProjectStore();
  const [localQs, setLocalQs] = useState<Question[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => { setLocalQs(questions); }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localQs.findIndex((q) => q.id === active.id);
    const newIndex = localQs.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(localQs, oldIndex, newIndex).map((q, i) => ({
      ...q, display_order: i,
    }));
    setLocalQs(reordered);
    setReordering(true);

    // Persist new order
    await Promise.all(
      reordered.map((q) =>
        supabase.from('questions').update({ display_order: q.display_order }).eq('id', q.id),
      ),
    );
    setReordering(false);
  };

  const appBase = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin;
  const surveyUrl = current ? `${appBase}/s/${current.slug}` : '';

  return (
    <div className="p-8">
      <PageHeader
        title="Survey Builder"
        subtitle="Questions here become the public survey respondents fill out."
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add question
          </Button>
        }
      />

      {/* Share card */}
      {current && (
        <Card className="mb-6 bg-[rgba(59,130,246,.04)] border-[rgba(59,130,246,.2)]">
          <CardTitle>🔗 Public Survey Link</CardTitle>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12px] font-mono text-[var(--accent2)] bg-[var(--surface2)] rounded-lg px-3 py-2 border border-[var(--border)] truncate">
              {surveyUrl}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { navigator.clipboard.writeText(surveyUrl); toast.success('Copied!'); }}
            >
              <Copy size={13} /> Copy
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(surveyUrl, '_blank')}
            >
              <ExternalLink size={13} /> Preview
            </Button>
          </div>
          <p className="text-[11px] text-[var(--text3)] mt-2">
            Anyone with this link can fill in the survey — no login required.
          </p>
        </Card>
      )}

      {/* Question list */}
      {localQs.length === 0 ? (
        <EmptyState
          icon="❓"
          title="No questions yet"
          description="Add your first question to build the survey respondents will see."
          action={<Button variant="primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add question</Button>}
        />
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[12px] text-[var(--text3)]">
            {localQs.length} question{localQs.length !== 1 ? 's' : ''} — drag to reorder
            {reordering && <span className="ml-2 text-[var(--accent)]">Saving…</span>}
          </p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={localQs.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {localQs.map((q, i) => (
              <SortableQuestion
                key={q.id}
                question={q}
                index={i}
                onEdit={() => setEditTarget(q)}
                onDelete={async () => {
                  await supabase.from('questions').delete().eq('id', q.id);
                  await refreshDeps(id!);
                  toast.success('Question removed');
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add / Edit modal */}
      <QuestionModal
        open={addOpen || !!editTarget}
        initial={editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        onSave={async (data) => {
          setSaving(true);
          const opts = data.options
            ? data.options.split(',').map((s) => s.trim()).filter(Boolean)
            : null;

          if (editTarget) {
            await supabase.from('questions').update({
              type: data.type, label: data.label,
              required: data.required, options: opts,
            }).eq('id', editTarget.id);
          } else {
            const maxOrder = localQs.reduce((m, q) => Math.max(m, q.display_order), -1);
            await supabase.from('questions').insert({
              project_id: id,
              type: data.type,
              label: data.label,
              required: data.required,
              options: opts,
              display_order: maxOrder + 1,
            });
          }

          await refreshDeps(id!);
          setSaving(false);
          setAddOpen(false);
          setEditTarget(null);
          toast.success(editTarget ? 'Question updated' : 'Question added');
        }}
        saving={saving}
      />
    </div>
  );
}

// ── Sortable Question Row ────────────────────────────────────────────────────

function SortableQuestion({
  question: q, index, onEdit, onDelete,
}: { question: Question; index: number; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = QUESTION_TYPES.find((t) => t.value === q.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-[rgba(59,130,246,.25)] transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="text-[var(--text3)] hover:text-[var(--text2)] cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical size={16} />
      </div>
      <div className="w-6 h-6 rounded-full bg-[var(--surface2)] text-[10px] font-bold text-[var(--text3)] flex items-center justify-center flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13px] truncate">{q.label}</div>
        <div className="text-[11px] text-[var(--text3)] mt-0.5">{typeInfo?.description}</div>
      </div>
      <Badge variant={typeColors[q.type] as 'blue' | 'red' | 'yellow' | 'green' | 'purple'} className="flex-shrink-0">
        {typeInfo?.label}
      </Badge>
      {q.required && <Badge variant="neutral" className="flex-shrink-0">Required</Badge>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="hover:text-[var(--red)]">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

// ── Question Modal ───────────────────────────────────────────────────────────

interface QuestionModalProps {
  open: boolean;
  initial: Question | null;
  onClose: () => void;
  onSave: (data: QForm) => Promise<void>;
  saving: boolean;
}

function QuestionModal({ open, initial, onClose, onSave, saving }: QuestionModalProps) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<QForm>({
    resolver: zodResolver(qSchema),
    defaultValues: { type: 'text', required: true },
  });

  useEffect(() => {
    if (initial) {
      reset({
        type: initial.type,
        label: initial.label,
        required: initial.required,
        options: initial.options?.join(', ') ?? '',
      });
    } else {
      reset({ type: 'text', required: true, label: '', options: '' });
    }
  }, [initial, open, reset]);

  const selectedType = watch('type') as QuestionType;
  const needsOptions = selectedType === 'choice' || selectedType === 'multi_choice';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit question' : 'Add question'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit(onSave)}>
            {initial ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSave)}>
        <Select
          label="Question type"
          options={QUESTION_TYPES.map((t) => ({ value: t.value, label: `${t.label} — ${t.description}` }))}
          error={errors.type?.message}
          {...register('type')}
        />
        <Textarea
          label="Question text"
          placeholder="e.g. How painful is it to monitor your family from abroad? (1 = not painful, 10 = extremely painful)"
          required
          rows={2}
          error={errors.label?.message}
          {...register('label')}
        />
        {needsOptions && (
          <Input
            label="Options (comma-separated)"
            placeholder="e.g. Monthly, Weekly, Daily, Never"
            hint="Each option separated by a comma"
            error={errors.options?.message}
            {...register('options')}
          />
        )}
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input type="checkbox" {...register('required')} className="w-auto" />
          Required question
        </label>
      </form>
    </Modal>
  );
}
