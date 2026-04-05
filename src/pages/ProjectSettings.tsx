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
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Trash2, Copy, ExternalLink } from 'lucide-react';
import { slugify } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).optional(),
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
  const [enabledLangs, setEnabledLangs] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const [syncedProjectId, setSyncedProjectId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [syncedSlug, setSyncedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'survey' | 'analytics' | 'languages' | 'danger'>('general');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  // Sync slug when project loads
  if (project && project.slug !== syncedSlug) {
    setSyncedSlug(project.slug);
    setSlugValue(project.slug);
  }

  // Sync form + painIds when project loads/changes (render-phase update avoids cascading effect)
  if (project && project.id !== syncedProjectId) {
    setSyncedProjectId(project.id);
    setPainIds(project.settings?.pain_question_ids ?? []);
    setEnabledLangs(project.settings?.enabled_languages ?? []);
    reset({
      name: project.name ?? '',
      description: project.description ?? '',
      survey_welcome: project.settings?.survey_welcome ?? '',
      survey_thankyou: project.settings?.survey_thankyou ?? '',
      concept_question_id: project.settings?.concept_question_id ?? '',
      pilot_question_id: project.settings?.pilot_question_id ?? ''
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

    // Update name/description if changed
    if (data.name !== project.name || (data.description ?? '') !== (project.description ?? '')) {
      const { error: detailsError } = await supabase
        .from('projects')
        .update({ name: data.name, description: data.description || null })
        .eq('id', project.id);
      if (detailsError) { setSaving(false); toast.error('Failed to save project details'); return; }
    }

    const settings: PS = {
      ...project.settings,
      pain_question_ids: painIds,
      enabled_languages: enabledLangs.length ? enabledLangs : undefined,
      concept_question_id: data.concept_question_id || undefined,
      pilot_question_id: data.pilot_question_id || undefined,
      survey_welcome: data.survey_welcome || undefined,
      survey_thankyou: data.survey_thankyou || undefined,
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

  const generateTranslations = async () => {
    if (!project) return;
    if (enabledLangs.length === 0) { toast.error('Enable at least one language first.'); return; }
    setTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch('/api/translate-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ projectId: project.id, languages: enabledLangs }),
      });
      const json = await resp.json() as { translatedCount?: number; error?: string };
      if (!resp.ok) { toast.error(json.error ?? 'Translation failed'); return; }
      toast.success(`Translated ${json.translatedCount ?? 0} question(s) into ${enabledLangs.length} language(s)`);
    } catch {
      toast.error('Network error — translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const saveSlug = async () => {
    if (!project) return;
    const clean = slugify(slugValue);
    if (!clean) { setSlugError('Slug cannot be empty'); return; }
    if (clean === project.slug) { setSlugError(''); return; }
    setSlugSaving(true);
    setSlugError('');
    // Check uniqueness
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', clean)
      .neq('id', project.id)
      .maybeSingle();
    if (existing) {
      setSlugError('This slug is already taken — try another');
      setSlugSaving(false);
      return;
    }
    const { error } = await supabase.from('projects').update({ slug: clean }).eq('id', project.id);
    setSlugSaving(false);
    if (error) { setSlugError('Failed to save slug'); return; }
    setSlugValue(clean);
    setSyncedSlug(clean);
    toast.success('Survey link updated!');
    if (id) loadProject(id);
  };

  const appBase = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin;
  const surveyUrl = project ? `${appBase}/s/${slugValue}` : '';

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

      {/* Tab bar */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-full mb-6 overflow-x-auto">
        {([
          ['general',   'General'],
          ['survey',    'Survey'],
          ['analytics', 'Analytics'],
          ['languages', 'Languages'],
          ['danger',    'Danger'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 min-w-fit px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
              activeTab === key
                ? key === 'danger'
                  ? 'bg-[rgba(239,68,68,.12)] text-[var(--red)] border border-[rgba(239,68,68,.25)]'
                  : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]'
                : 'text-[var(--text2)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Idea Details */}
        {activeTab === 'general' && (
        <Card accent="orange" className="p-5">
          <CardTitle>Idea Details</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Edit the name and description of this idea.
          </p>
          <div className="space-y-4">
            <Input
              label="Idea Name"
              placeholder="e.g. My Startup Idea"
              error={errors.name?.message}
              {...register('name')}
            />
            <Textarea
              label="Description"
              hint="Describe the problem you're solving and your proposed solution."
              placeholder="e.g. A platform that helps founders validate their ideas before building."
              rows={3}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </Card>
        )}

        {/* Metric Mapping */}
        {activeTab === 'analytics' && (
        <Card accent="blue" className="p-5">
          <CardTitle>Metric Mapping</CardTitle>
          <div className="flex items-start gap-3 bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.3)] rounded-xl px-4 py-3 mb-4">
            <span className="text-amber-400 flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-[12px] text-[var(--text2)] leading-relaxed">
              This is what powers the <strong className="text-[var(--text)]">Feel the Pain %</strong> and <strong className="text-[var(--text)]">Want a Solution %</strong> stats on your dashboard. Without mapping questions here, those cards will always show 0%.
            </p>
          </div>
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
        )}

        {/* Survey Text */}
        {activeTab === 'survey' && (
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
        )}

        {/* Survey Languages */}
        {activeTab === 'languages' && (
        <Card accent="blue" className="p-5">
          <CardTitle>Survey Languages</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Enable languages to let respondents take the survey in their preferred language.
            After enabling, use <strong>Translate survey</strong> in Survey Builder to generate translations.
          </p>
          <div className="flex flex-wrap gap-2">
            {/* English is always on */}
            <span className="px-3 py-1.5 rounded-lg border text-[12px] flex items-center gap-1.5 bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)] opacity-60 cursor-not-allowed">
              <span>🇬🇧</span> English <Badge variant="blue" size="sm">always on</Badge>
            </span>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isOn = enabledLangs.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() =>
                    setEnabledLangs((prev) =>
                      isOn ? prev.filter((c) => c !== lang.code) : [...prev, lang.code]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg border text-[12px] transition-all flex items-center gap-1.5 ${
                    isOn
                      ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]'
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--accent)]'
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                  {isOn && <span className="text-[var(--accent)] font-bold ml-0.5">✓</span>}
                </button>
              );
            })}
          </div>
          {enabledLangs.length > 0 && (
            <p className="text-[11px] text-[var(--text3)] mt-3">
              {enabledLangs.length} language{enabledLangs.length > 1 ? 's' : ''} enabled — remember to save, then run <strong>Translate survey</strong>.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="secondary"
              type="button"
              size="sm"
              loading={translating}
              disabled={enabledLangs.length === 0}
              onClick={generateTranslations}
            >
              ✦ Generate Translations
            </Button>
            <p className="text-[11px] text-[var(--text3)]">
              Translations are saved per-question and used automatically on the survey. Re-run after adding new questions.
            </p>
          </div>
        </Card>
        )}

        {/* Survey Link */}
        {activeTab === 'survey' && (
        <Card accent="purple" className="p-5">
          <CardTitle>Public Survey Link</CardTitle>
          <p className="text-[12px] text-[var(--text3)] mb-4">
            Customise the URL slug for your public survey. Only lowercase letters, numbers, and hyphens are allowed.
          </p>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-0 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface2)] focus-within:border-[var(--accent)] transition-colors">
                <span className="px-3 text-[12px] text-[var(--text3)] whitespace-nowrap border-r border-[var(--border)] bg-[var(--bg)] py-2">
                  /s/
                </span>
                <input
                  className="flex-1 bg-transparent px-3 py-2 text-[13px] text-[var(--text)] outline-none font-mono"
                  value={slugValue}
                  onChange={(e) => { setSlugValue(e.target.value); setSlugError(''); }}
                  onBlur={() => setSlugValue(slugify(slugValue) || slugValue)}
                  placeholder="your-survey-slug"
                />
              </div>
              {slugError && <p className="text-[11px] text-[var(--red)] mt-1">{slugError}</p>}
              <p className="text-[11px] text-[var(--text3)] mt-1">Preview: <span className="font-mono text-[var(--accent2)]">{surveyUrl}</span></p>
            </div>
            <Button variant="secondary" type="button" size="sm" loading={slugSaving} onClick={saveSlug} className="mt-0.5">
              Update
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" type="button" onClick={() => { navigator.clipboard.writeText(surveyUrl); toast.success('Copied!'); }}>
              <Copy size={13} /> Copy link
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => window.open(surveyUrl, '_blank')}>
              <ExternalLink size={13} /> Preview
            </Button>
          </div>
        </Card>
        )}

        {activeTab !== 'danger' && (
        <div className="flex justify-end">
          <Button variant="primary" type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
        )}

        {/* Danger zone */}
        {activeTab === 'danger' && (
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
        )}
      </form>
    </div>
  );
}
