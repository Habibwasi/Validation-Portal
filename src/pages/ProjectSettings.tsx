import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectStore } from '@/store/projectStore';
import { supabase } from '@/lib/supabase';
import type { ProjectSettings as PS } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const schema = z.object({
  survey_welcome: z.string().max(300).optional(),
  survey_thankyou: z.string().max(300).optional(),
  concept_question_id: z.string().optional(),
  pilot_question_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const { current: project, questions, loadProject } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [painIds, setPainIds] = useState<string[]>([]);
  const [syncedProjectId, setSyncedProjectId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(['en']);
  const [translating, setTranslating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  // Sync form + painIds when project loads/changes (render-phase update avoids cascading effect)
  if (project && project.id !== syncedProjectId) {
    setSyncedProjectId(project.id);
    setPainIds(project.settings?.pain_question_ids ?? []);
    setEnabledLanguages(['en', ...(project.settings?.enabled_languages ?? [])]);
    reset({
      survey_welcome: project.settings?.survey_welcome ?? '',
      survey_thankyou: project.settings?.survey_thankyou ?? '',
      concept_question_id: project.settings?.concept_question_id ?? '',
      pilot_question_id: project.settings?.pilot_question_id ?? '',
    });
  }

  const scaleRatingQs = questions.filter((q) => q.type === 'scale' || q.type === 'rating');
  const yesNoQs = questions.filter((q) => q.type === 'yes_no');

  const togglePainId = (qId: string) => {
    setPainIds((prev) =>
      prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (!project) return;
    setSaving(true);

    const settings: PS = {
      ...project.settings,
      pain_question_ids: painIds,
      concept_question_id: data.concept_question_id || undefined,
      pilot_question_id: data.pilot_question_id || undefined,
      survey_welcome: data.survey_welcome || undefined,
      survey_thankyou: data.survey_thankyou || undefined,
      enabled_languages: enabledLanguages.filter((l) => l !== 'en'),
    };

    const { error } = await supabase
      .from('projects')
      .update({ settings })
      .eq('id', project.id);

    setSaving(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Settings saved');
    if (id) loadProject(id);
  };

  const toggleLanguage = (code: string) => {
    if (code === 'en') return; // English is always on
    setEnabledLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const generateTranslations = async () => {
    if (!project) return;
    const langs = enabledLanguages.filter((l) => l !== 'en');
    if (langs.length === 0) { toast.error('Enable at least one language besides English.'); return; }
    setTranslating(true);
    try {
      const resp = await fetch('/api/translate-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, languages: langs }),
      });
      const json = await resp.json() as { translated?: number; error?: string };
      if (!resp.ok) { toast.error(json.error ?? 'Translation failed'); return; }
      toast.success(`Translated ${json.translated ?? 0} questions into ${langs.length} language(s)`);
    } catch {
      toast.error('Network error — translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const archiveProject = async () => {
    if (!project) return;
    setArchiving(true);
    const { error } = await supabase
      .from('projects')
      .update({ archived: true })
      .eq('id', project.id);
    setArchiving(false);
    if (error) { toast.error('Failed to archive'); return; }
    toast.success('Project archived');
    window.location.href = '/';
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pb-16">
      <PageHeader
        title="Project Settings"
        subtitle="Configure how your survey works and which questions map to your validation metrics"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Metric Mapping */}
        <Card accent="blue" className="p-5">
          <CardTitle>Metric Mapping</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Tell the dashboard which survey questions to use for each validation signal.
          </p>

          <div className="space-y-5">
            {/* Pain question IDs */}
            <div>
              <label className="block text-[12px] font-semibold text-[var(--text2)] mb-2">
                Pain / Rating Questions
                <span className="ml-1.5 text-[var(--text3)] font-normal">(used for pain score averages)</span>
              </label>
              {scaleRatingQs.length === 0 ? (
                <p className="text-[12px] text-[var(--text3)] italic">No scale or rating questions in your survey yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {scaleRatingQs.map((q) => {
                    const selected = painIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => togglePainId(q.id)}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] transition-all ${
                          selected
                            ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]'
                            : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--accent)]'
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}
                        {q.label.length > 40 ? q.label.slice(0, 40) + '…' : q.label}
                        <Badge variant={q.type === 'rating' ? 'blue' : 'purple'} size="sm" className="ml-1.5">{q.type}</Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Concept question */}
            <Select
              label="Concept Interest Question"
              hint="A Yes/No question — % who answer 'Yes' = concept interest rate"
              placeholder="Not set"
              options={[
                { value: '', label: '— none —' },
                ...yesNoQs.map((q) => ({ value: q.id, label: q.label })),
              ]}
              error={errors.concept_question_id?.message}
              {...register('concept_question_id')}
            />

            {/* Pilot question */}
            <Select
              label="Pilot Ready Question"
              hint="A Yes/No question — 'Yes' answers count toward pilot ready metric"
              placeholder="Not set"
              options={[
                { value: '', label: '— none —' },
                ...yesNoQs.map((q) => ({ value: q.id, label: q.label })),
              ]}
              error={errors.pilot_question_id?.message}
              {...register('pilot_question_id')}
            />
          </div>
        </Card>

        {/* Survey Text */}
        <Card accent="green" className="p-5">
          <CardTitle>Survey Copy</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Customise the text shown to respondents on the public survey page.
          </p>
          <div className="space-y-4">
            <Textarea
              label="Welcome Message"
              hint="Shown at the top of the survey. Max 300 characters."
              placeholder="e.g. This takes ~3 minutes and helps us build something you'll actually love."
              rows={2}
              error={errors.survey_welcome?.message}
              {...register('survey_welcome')}
            />
            <Textarea
              label="Thank-You Message"
              hint="Shown after submission. Max 300 characters."
              placeholder="e.g. Your response has been recorded — thank you for shaping this idea!"
              rows={2}
              error={errors.survey_thankyou?.message}
              {...register('survey_thankyou')}
            />
          </div>
        </Card>

        {/* Survey Languages */}
        <Card accent="purple" className="p-5">
          <CardTitle>Survey Languages</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Select which languages respondents can choose from. Click "Generate Translations" to auto-translate all questions via AI.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = enabledLanguages.includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  disabled={l.code === 'en'}
                  onClick={() => toggleLanguage(l.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                    active
                      ? 'bg-[rgba(139,92,246,.15)] border-[var(--accent2)] text-[var(--text)]'
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--accent2)]'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className="text-base">{l.flag}</span>
                  {l.label}
                  {active && l.code !== 'en' && <span className="text-[var(--accent2)]">✓</span>}
                  {l.code === 'en' && <Badge variant="blue" size="sm">always on</Badge>}
                </button>
              );
            })}
          </div>
          <Button
            variant="secondary"
            type="button"
            size="sm"
            loading={translating}
            onClick={generateTranslations}
          >
            ✦ Generate Translations
          </Button>
          <p className="text-[11px] text-[var(--text3)] mt-2">
            Translations are saved per-question and used automatically on the survey. Re-run any time after adding new questions.
          </p>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>

        {/* Danger zone */}
        <Card accent="red" className="p-5">
          <CardTitle>Danger Zone</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Archiving hides this project from the active view. All data is preserved and can be restored.
          </p>
          <Button
            variant="danger"
            type="button"
            size="sm"
            loading={archiving}
            onClick={archiveProject}
          >
            <Trash2 size={14} className="mr-1.5" />
            Archive Project
          </Button>
        </Card>
      </form>
    </div>
  );
}
