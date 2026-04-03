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
import { GripVertical, Plus, Trash2, Copy, ExternalLink, ChevronDown, ChevronRight, Wand2, Save, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [delResponse, setDelResponse] = useState<SurveyResponse | null>(null);
  const [deletingResponse, setDeletingResponse] = useState(false);
  const [saveAll, setSaveAll] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [momChecking, setMomChecking] = useState(false);
  const [momResults, setMomResults] = useState<Record<string, MomTestResult>>({});

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
        translations: q.translations,
      })));

      // Update existing questions
      const toUpdate = localQs.filter((q) => originalIds.has(q.id));
      await Promise.all(toUpdate.map((q) => supabase.from('questions').update({
        type: q.type, label: q.label, required: q.required,
        options: q.options, display_order: q.display_order,
        translations: q.translations,
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
          prompt: `You are a startup validation expert trained in The Mom Test by Rob Fitzpatrick. Generate 5 NEW survey questions to validate this product concept.

Product name: ${current.name}
Description: ${current.description}
${localQs.length > 0 ? `\nExisting questions (do NOT repeat or rephrase these):\n${localQs.map((q, i) => `${i + 1}. ${q.label}`).join('\n')}\n\nGenerate questions that cover different angles not already addressed above.` : ''}

CRITICAL — all questions MUST follow The Mom Test rules:
- Ask about PAST behaviour, not hypothetical futures ("Have you ever…" not "Would you…")
- Never lead the respondent ("Do you find X frustrating?" → bad. "How do you currently handle X?" → good)
- Never pitch the idea or ask for validation ("Would you use our app?" → forbidden)
- Ask about real problems they have faced, how they currently solve them, and how much effort/money that costs
- For rating/scale questions: measure how painful an existing, confirmed problem is — not whether they like your idea
- For yes/no: ask about concrete past actions or current reality

Return ONLY valid JSON:
{ "questions": [{ "type": "text|long_text|rating|scale|yes_no|choice|multi_choice", "label": "...", "required": true, "options": null }] }

Available types: text, long_text, rating (pain 1-10), scale (1-10), yes_no, choice (needs options array), multi_choice (needs options array).
Focus on: confirming the problem exists, measuring pain severity, understanding current workarounds, frequency of the problem, and who the real sufferer is.`,
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

  const onMomTest = async () => {
    if (localQs.length === 0) { toast.error('Add some questions first.'); return; }
    setMomChecking(true);
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert in The Mom Test by Rob Fitzpatrick — the gold standard for unbiased customer discovery.

Score each survey question below against Mom Test principles. Judge the WORDING, not the question format (rating/scale/yes_no are all structurally valid).

Flag questions when the WORDING is:
- Leading: pushes toward a positive answer ("Don't you think…", "Wouldn't it be useful…", "How helpful would our solution be?" — the word "helpful" assumes it is helpful)
- Hypothetical about the solution: asks what they WOULD do with your product ("Would you use…", "Would you pay for…", "How likely are you to use…") — unreliable future intent
- Compliment-fishing or idea-validating: designed to make the founder feel good rather than surface real problems
- Pitching: reveals/promotes the solution before asking about the problem
- Future-focused in a biased way: "How valuable would X be?" assumes value exists

Still flag a rating question if its wording is leading or solution-focused.
For example: "How useful would this feature be? (1–10)" is BAD — it assumes the feature is useful.
But: "How often do you experience [problem]? (1–10)" is GOOD — it measures an existing reality.

For EACH question return:
- score: "good" | "warning" (mild wording issue, small fix needed) | "bad" (biased wording, will produce false positives)
- issue: one short sentence on the specific wording problem (null if good)
- suggestion: a concrete rewritten version that fixes the bias (null if good)

Return ONLY valid JSON:
{ "results": [ { "id": "...", "score": "good"|"warning"|"bad", "issue": "..." | null, "suggestion": "..." | null } ] }

Questions:
${localQs.map((q) => `{ "id": "${q.id}", "label": ${JSON.stringify(q.label)} }`).join('\n')}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { results?: MomTestResult[] };
      if (!Array.isArray(data.results)) throw new Error('Unexpected response shape');
      const map: Record<string, MomTestResult> = {};
      for (const r of data.results) map[r.id] = r;
      // Deliberately bypass the localQs-clearing effect by setting directly
      setMomResults(map);
      const bad = data.results.filter((r) => r.score === 'bad').length;
      const warn = data.results.filter((r) => r.score === 'warning').length;
      if (bad + warn === 0) {
        toast.success('All questions pass the Mom Test ✓');
      } else {
        toast(`${bad} problematic · ${warn} warning${warn !== 1 ? 's' : ''} — see below`, { icon: '⚠️' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Mom Test check failed: ${msg}`);
    } finally {
      setMomChecking(false);
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
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Survey Builder"
        subtitle="Questions here become the public survey respondents fill out."
        actions={
          <div className="flex gap-2">
            {localQs.length > 0 && (
              <Button
                variant="secondary"
                loading={momChecking}
                onClick={onMomTest}
                title="Check questions against Mom Test principles"
              >
                <ShieldCheck size={15} />
                {momChecking ? 'Checking…' : 'Mom Test'}
              </Button>
            )}
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
                momResult={momResults[q.id] ?? null}
                onEdit={() => setEditTarget(q)}
                onDelete={() => {
                  setLocalQs((prev) => prev.filter((r) => r.id !== q.id));
                  setMomResults((prev) => { const next = { ...prev }; delete next[q.id]; return next; });
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
        enabledLangs={current?.settings?.enabled_languages ?? []}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        onSave={async (data, translations) => {
          const opts = data.options
            ? data.options.split(',').map((s) => s.trim()).filter(Boolean)
            : null;

          // Clean translations — remove entries with empty labels
          const cleanedTrans = Object.fromEntries(
            Object.entries(translations).filter(([, v]) => v.label.trim()),
          ) as Record<string, { label: string; options?: string[] }>;
          const finalTrans = Object.keys(cleanedTrans).length > 0 ? cleanedTrans : null;

          if (editTarget) {
            setLocalQs((prev) => prev.map((q) => q.id === editTarget.id
              ? { ...q, type: data.type as QuestionType, label: data.label, required: data.required, options: opts, translations: finalTrans }
              : q
            ));
            // Clear only this question's Mom Test result since its label may have changed
            setMomResults((prev) => { const next = { ...prev }; delete next[editTarget.id]; return next; });
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
              translations: finalTrans,
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
                <span className="text-[11px] text-[var(--text3)] w-24 sm:w-40 flex-shrink-0 truncate" title={q.label}>{q.label}</span>
                <span className="text-[12px] text-[var(--text)] min-w-0 break-words">{display}</span>
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

// ── Mom Test types ───────────────────────────────────────────────────────────

interface MomTestResult {
  id: string;
  score: 'good' | 'warning' | 'bad';
  issue: string | null;
  suggestion: string | null;
}

// ── Sortable Question Row ────────────────────────────────────────────────────

function SortableQuestion({
  question: q, index, onEdit, onDelete, momResult,
}: { question: Question; index: number; onEdit: () => void; onDelete: () => void; momResult: MomTestResult | null }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = QUESTION_TYPES.find((t) => t.value === q.type);

  const cardBorder = momResult?.score === 'bad'
    ? 'border-[rgba(239,68,68,.4)] hover:border-[rgba(239,68,68,.6)]'
    : momResult?.score === 'warning'
      ? 'border-[rgba(251,191,36,.4)] hover:border-[rgba(251,191,36,.6)]'
      : momResult?.score === 'good'
        ? 'border-[rgba(34,197,94,.35)] hover:border-[rgba(34,197,94,.55)]'
        : 'border-[rgba(255,255,255,.04)] hover:border-[rgba(59,130,246,.25)]';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--surface)] border rounded-xl px-4 py-3 group transition-all ${cardBorder}`}
    >
      <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] text-[var(--text3)]">{typeInfo?.description}</span>
            <Badge variant={typeColors[q.type] as 'blue' | 'red' | 'yellow' | 'green' | 'purple'}>
              {typeInfo?.label}
            </Badge>
            {q.required && <Badge variant="neutral">Required</Badge>}
            {momResult?.score === 'good' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#22c55e] font-semibold">
                <CheckCircle2 size={11} /> Mom Test pass
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="hover:text-[var(--red)]">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {momResult && momResult.score !== 'good' && (
        <div className={`mt-3 pt-3 border-t space-y-2 ${
          momResult.score === 'bad' ? 'border-[rgba(239,68,68,.2)]' : 'border-[rgba(251,191,36,.2)]'
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={13}
              className={`flex-shrink-0 mt-0.5 ${momResult.score === 'bad' ? 'text-[#ef4444]' : 'text-[#fbbf24]'}`}
            />
            <p className={`text-[12px] font-medium leading-snug ${momResult.score === 'bad' ? 'text-[#ef4444]' : 'text-[#fbbf24]'}`}>
              {momResult.issue}
            </p>
          </div>
          {momResult.suggestion && (
            <div className="ml-5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] mb-1">Suggested rewrite</p>
              <p className="text-[12px] text-[var(--text2)] italic">&ldquo;{momResult.suggestion}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Question Modal ───────────────────────────────────────────────────────────

interface QuestionModalProps {
  open: boolean;
  initial: Question | null;
  onClose: () => void;
  onSave: (data: QForm, translations: Record<string, { label: string; options?: string[] }>) => Promise<void>;
  saving: boolean;
  enabledLangs: string[];
}

function QuestionModal({ open, initial, onClose, onSave, saving, enabledLangs }: QuestionModalProps) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<QForm>({
    resolver: zodResolver(qSchema),
    defaultValues: { type: 'text', required: true },
  });
  const [localTranslations, setLocalTranslations] = useState<Record<string, { label: string; options?: string[] }>>({});

  useEffect(() => {
    const initTrans: Record<string, { label: string; options?: string[] }> = {};
    for (const lang of enabledLangs) {
      const existing = initial?.translations?.[lang];
      initTrans[lang] = { label: existing?.label ?? '', ...(existing?.options ? { options: existing.options } : {}) };
    }
    setLocalTranslations(initTrans);
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

  const handleSave = handleSubmit((data: QForm) => onSave(data, localTranslations));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit question' : 'Add question'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {initial ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSave}>
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

        {enabledLangs.length > 0 && (
          <div className="border border-[var(--border)] rounded-xl p-4 space-y-4 mt-1">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider">Translations</p>
              <p className="text-[11px] text-[var(--text3)] mt-0.5">Edit translated text per language. Leave blank to fall back to auto-generated translation.</p>
            </div>
            {enabledLangs.map((langCode) => {
              const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
              if (!lang) return null;
              const trans = localTranslations[langCode] ?? { label: '' };
              return (
                <div key={langCode} className="space-y-2">
                  <p className="text-[12px] font-medium text-[var(--text2)]">{lang.flag} {lang.label}</p>
                  <Textarea
                    placeholder={`Question in ${lang.label}…`}
                    rows={2}
                    value={trans.label}
                    onChange={(e) => setLocalTranslations((prev) => ({
                      ...prev,
                      [langCode]: { ...prev[langCode], label: e.target.value },
                    }))}
                  />
                  {needsOptions && (
                    <Input
                      placeholder={`Options in ${lang.label} (comma-separated)`}
                      value={trans.options?.join(', ') ?? ''}
                      onChange={(e) => setLocalTranslations((prev) => ({
                        ...prev,
                        [langCode]: { ...prev[langCode], options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
                      }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </form>
    </Modal>
  );
}
