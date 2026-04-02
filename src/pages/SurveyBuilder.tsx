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
import { GripVertical, Plus, Trash2, Copy, ExternalLink, ChevronDown, ChevronRight, Wand2, Languages, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import type { Question, QuestionType, SurveyResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import { REGIONS, SUPPORTED_LANGUAGES } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
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
  const { current, questions, surveys, refreshDeps } = useProjectStore();
  const [localQs, setLocalQs] = useState<Question[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [delResponse, setDelResponse] = useState<SurveyResponse | null>(null);
  const [deletingResponse, setDeletingResponse] = useState(false);
  const [saveAll, setSaveAll] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) setLocalQs(questions);
  }, [questions]);

  const onSave = async () => {
    if (!id) return;
    setSaveAll(true);
    try {
      const originalIds = new Set(questions.map((q) => q.id));
      const localIds = new Set(localQs.map((q) => q.id));

      // Delete removed questions (real IDs only)
      const toDelete = questions.filter((q) => !localIds.has(q.id));
      await Promise.all(toDelete.map((q) => supabase.from('questions').delete().eq('id', q.id)));

      // Insert new questions (temp IDs not in original set)
      const toInsert = localQs.filter((q) => !originalIds.has(q.id));
      await Promise.all(toInsert.map((q) => supabase.from('questions').insert({
        project_id: id, type: q.type, label: q.label,
        required: q.required, options: q.options, display_order: q.display_order,
      })));

      // Update existing questions
      const toUpdate = localQs.filter((q) => originalIds.has(q.id));
      await Promise.all(toUpdate.map((q) => supabase.from('questions').update({
        type: q.type, label: q.label, required: q.required,
        options: q.options, display_order: q.display_order,
      }).eq('id', q.id)));

      await refreshDeps(id);
      setIsDirty(false);
      toast.success('Survey saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaveAll(false);
    }
  };

  const onGenerate = async () => {
    if (!current?.description || !id) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a startup validation expert. Generate 5 NEW survey questions to validate this product concept.

Product name: ${current.name}
Description: ${current.description}
${localQs.length > 0 ? `\nExisting questions (do NOT repeat or rephrase these):\n${localQs.map((q, i) => `${i + 1}. ${q.label}`).join('\n')}\n\nGenerate questions that cover different angles not already addressed above.` : ''}

Return ONLY valid JSON:
{ "questions": [{ "type": "text|long_text|rating|scale|yes_no|choice|multi_choice", "label": "...", "required": true, "options": null }] }

Available types: text, long_text, rating (pain 1-10), scale (1-10), yes_no, choice (needs options array), multi_choice (needs options array).
Focus on: problem pain level, current alternatives, willingness to pay, concept interest, pilot readiness.`,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}${errText ? `: ${errText}` : ''}`);
      }
      const data = await res.json() as { questions?: { type: string; label: string; required: boolean; options: string[] | null }[] };
      const qs = data.questions;
      if (!Array.isArray(qs) || qs.length === 0) throw new Error('No questions returned');
      const maxOrder = localQs.reduce((m, q) => Math.max(m, q.display_order), -1);
      const newQs: Question[] = qs.map((q, i) => ({
        id: `temp-${Date.now()}-${i}`,
        project_id: id!,
        type: q.type as QuestionType,
        label: q.label,
        required: q.required,
        options: q.options?.length ? q.options : null,
        display_order: maxOrder + 1 + i,
        translations: null,
        created_at: new Date().toISOString(),
      }));
      setLocalQs((prev) => [...prev, ...newQs]);
      setIsDirty(true);
      toast.success(`${qs.length} questions generated — press Save to apply`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Could not generate questions: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const onTranslate = async () => {
    const enabledLangs = current?.settings?.enabled_languages;
    if (!enabledLangs?.length || !id) return;
    setTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/translate-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ projectId: id, languages: enabledLangs }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}${errText ? `: ${errText}` : ''}`);
      }
      await refreshDeps(id);
      const langLabels = enabledLangs
        .map((c) => SUPPORTED_LANGUAGES.find((l) => l.code === c)?.label ?? c)
        .join(', ');
      toast.success(`Survey translated into ${langLabels}!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Translation failed: ${msg}`);
    } finally {
      setTranslating(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localQs.findIndex((q) => q.id === active.id);
    const newIndex = localQs.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(localQs, oldIndex, newIndex).map((q, i) => ({
      ...q, display_order: i,
    }));
    setLocalQs(reordered);
    setIsDirty(true);
  };

  const appBase = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin;
  const surveyUrl = current ? `${appBase}/s/${current.slug}` : '';

  return (
    <div className="p-8">
      <PageHeader
        title="Survey Builder"
        subtitle="Questions here become the public survey respondents fill out."
        actions={
          <div className="flex gap-2">
            {current?.settings?.enabled_languages?.length
              ? (
                <Button
                  variant="secondary"
                  loading={translating}
                  onClick={onTranslate}
                  title={`Translate into ${current.settings.enabled_languages.join(', ')}`}
                >
                  <Languages size={15} />
                  {translating ? 'Translating…' : 'Translate survey'}
                </Button>
              ) : null
            }
            <Button
              variant="secondary"
              loading={generating}
              disabled={!current?.description}
              onClick={onGenerate}
              title={!current?.description ? 'Add a project description first' : 'Generate questions using AI'}
            >
              <Wand2 size={15} />
              {generating ? 'Generating…' : 'Generate with AI'}
            </Button>
            <Button variant={isDirty ? 'primary' : 'secondary'} loading={saveAll} onClick={onSave}>
              <Save size={15} /> Save
            </Button>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add question
            </Button>
          </div>
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
            {isDirty && <span className="ml-2 text-amber-400">Unsaved changes</span>}
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
                onDelete={() => {
                  setLocalQs((prev) => prev.filter((r) => r.id !== q.id));
                  setIsDirty(true);
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
          const opts = data.options
            ? data.options.split(',').map((s) => s.trim()).filter(Boolean)
            : null;

          if (editTarget) {
            setLocalQs((prev) => prev.map((q) => q.id === editTarget.id
              ? { ...q, type: data.type as QuestionType, label: data.label, required: data.required, options: opts }
              : q
            ));
          } else {
            const maxOrder = localQs.reduce((m, q) => Math.max(m, q.display_order), -1);
            const tempQ: Question = {
              id: `temp-${Date.now()}`,
              project_id: id!,
              type: data.type as QuestionType,
              label: data.label,
              required: data.required,
              options: opts,
              display_order: maxOrder + 1,
              translations: null,
              created_at: new Date().toISOString(),
            };
            setLocalQs((prev) => [...prev, tempQ]);
          }

          setIsDirty(true);
          setAddOpen(false);
          setEditTarget(null);
          toast.success(editTarget ? 'Question updated' : 'Question added — press Save to apply');
        }}
        saving={false}
      />

      {/* ── Survey Responses ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-[15px]">Survey Responses</h2>
            <p className="text-[11px] text-[var(--text3)] mt-0.5">{surveys.length} response{surveys.length !== 1 ? 's' : ''} collected</p>
          </div>
        </div>

        {surveys.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-5 py-8 text-center">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-[13px] text-[var(--text2)]">No responses yet — share the survey link above to start collecting.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {surveys.map((s) => (
              <ResponseRow
                key={s.id}
                response={s}
                questions={localQs}
                onDelete={() => setDelResponse(s)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!delResponse}
        onClose={() => setDelResponse(null)}
        onConfirm={async () => {
          if (!delResponse) return;
          setDeletingResponse(true);
          await supabase.from('survey_responses').delete().eq('id', delResponse.id);
          await refreshDeps(id!);
          setDeletingResponse(false);
          setDelResponse(null);
          toast.success('Response deleted');
        }}
        title="Delete response"
        message="Delete this survey response? This cannot be undone."
        loading={deletingResponse}
      />
    </div>
  );
}

// ── Response Row ─────────────────────────────────────────────────────────────

function ResponseRow({ response: r, questions, onDelete }: {
  response: SurveyResponse;
  questions: Question[];
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const region = REGIONS.find((reg) => reg.code === r.region);

  return (
    <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-xl px-4 py-3 group hover:border-[rgba(59,130,246,.2)] transition-all">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex-1 flex items-center gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown size={13} className="text-[var(--text3)] flex-shrink-0" /> : <ChevronRight size={13} className="text-[var(--text3)] flex-shrink-0" />}
          <div className="w-7 h-7 rounded-full bg-[rgba(6,182,212,.12)] text-[var(--accent2)] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            #
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[13px]">{formatDate(r.submitted_at)}</span>
              {region && <span className="text-[12px] text-[var(--text2)]">{region.flag} {region.label}</span>}
              <span className="text-[11px] text-[var(--text3)]">{Object.keys(r.answers).length} answer{Object.keys(r.answers).length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </button>
        <Button
          size="sm" variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--red)]"
          onClick={onDelete}
        >
          <Trash2 size={13} />
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
          {questions.map((q) => {
            const ans = r.answers[q.id];
            if (ans === undefined || ans === null || ans === '') return null;
            const display = Array.isArray(ans) ? ans.join(', ') : String(ans);
            return (
              <div key={q.id} className="flex gap-3">
                <span className="text-[11px] text-[var(--text3)] w-40 flex-shrink-0 truncate" title={q.label}>{q.label}</span>
                <span className="text-[12px] text-[var(--text)]">{display}</span>
              </div>
            );
          })}
          {questions.every((q) => r.answers[q.id] === undefined || r.answers[q.id] === null || r.answers[q.id] === '') && (
            <p className="text-[11px] text-[var(--text3)]">No answers recorded.</p>
          )}
        </div>
      )}
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
