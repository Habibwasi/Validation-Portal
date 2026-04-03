import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import type { Project, Question } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import toast from 'react-hot-toast';

export default function PublicSurvey() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0-indexed into questions
  const [transitioning, setTransitioning] = useState(false);
  const [activeLang, setActiveLang] = useState('en');

  const { register, handleSubmit, watch, setValue } = useForm<Record<string, unknown>>({});

  const goNext = () => {
    setTransitioning(true);
    setStep((s) => s + 1);
    setTimeout(() => setTransitioning(false), 150);
  };

  useEffect(() => {
    (async () => {
      const { data: proj, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('archived', false)
        .maybeSingle();

      if (error || !proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj);

      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('project_id', proj.id)
        .order('display_order');
      setQuestions(qs ?? []);
      setLoading(false);
    })();
  }, [slug]);

  const totalSteps = questions.length;
  const progress = Math.round((step / Math.max(totalSteps, 1)) * 100);

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!project || transitioning) return;
    setSubmitting(true);

    const answers: Record<string, unknown> = {};
    questions.forEach((q) => {
      answers[q.id] = data[q.id] ?? null;
    });

    const { error } = await supabase.from('survey_responses').insert({
      project_id: project.id,
      answers,
      region: null,
    });

    setSubmitting(false);
    if (error) { toast.error('Failed to submit — please try again.'); return; }

    // Fire-and-forget notification (doesn't block submission)
    fetch('/api/notify-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        projectName: project.name,
      }),
    }).catch(() => { /* ignore */ });

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-bold text-xl mb-2">Survey not found</h1>
          <p className="text-[var(--text2)] text-sm">This survey link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const thankyou = project?.settings?.survey_thankyou;
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-5xl mb-6">🙏</div>
          <h1 className="font-black text-2xl mb-3">Thank you!</h1>
          <p className="text-[var(--text2)] max-w-sm">
            {thankyou ?? 'Your response has been recorded. Your input is genuinely valuable.'}
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[step];

  const enabledLangs = project?.settings?.enabled_languages ?? [];
  const availableLangs = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    ...SUPPORTED_LANGUAGES.filter((l) => enabledLangs.includes(l.code)),
  ];

  // Helper: get translated label/options if available
  const tLabel = (q: Question) =>
    activeLang !== 'en' ? (q.translations?.[activeLang]?.label ?? q.label) : q.label;
  const tOptions = (q: Question) =>
    activeLang !== 'en' ? (q.translations?.[activeLang]?.options ?? q.options) : q.options;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center px-4 py-8 sm:py-12 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,.07),transparent_40%),var(--bg)]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="font-black text-[18px] tracking-wider uppercase mb-2">
            {project?.name}
          </div>
          {project?.settings?.survey_welcome && (
            <p className="text-[var(--text2)] text-[13px]">{project.settings.survey_welcome}</p>
          )}
          {!project?.settings?.survey_welcome && (
            <p className="text-[var(--text2)] text-[13px]">Anonymous survey — 100% confidential. No personal data collected.</p>
          )}
          {/* Language switcher */}
          {availableLangs.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {availableLangs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                    activeLang === l.code
                      ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text3)] hover:border-[var(--accent)]'
                  }`}
                >
                  <span>{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] text-[var(--text3)] mb-1.5">
            <span>Question {step + 1} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} height={5} />
        </div>

        {/* Card */}
        <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-2xl p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,.3)]">
          <form onSubmit={handleSubmit(onSubmit)}>

            {currentQ && (
              <div className="flex flex-col gap-4">
                <h2 className="font-bold text-[15px] leading-snug">{tLabel(currentQ)}</h2>
                {!currentQ.required && (
                  <p className="text-[11px] text-[var(--text3)] -mt-2">Optional</p>
                )}

                <QuestionInput q={currentQ} tOptions={tOptions(currentQ)} register={register} watch={watch} setValue={setValue} />

                <div className="flex justify-between mt-2">
                  {step > 0 ? (
                    <Button variant="ghost" type="button" onClick={() => setStep((s) => s - 1)}>
                      ← Back
                    </Button>
                  ) : <div />}
                  {step < questions.length - 1 ? (
                    <Button variant="primary" type="button" onClick={goNext}>
                      Next →
                    </Button>
                  ) : (
                    <Button variant="primary" type="submit" loading={submitting} disabled={transitioning || submitting}>
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--text3)] mt-4">
          Powered by <span className="text-[var(--accent2)]">Validate Portal</span>
        </p>
      </div>
    </div>
  );
}

// ── Question Input ───────────────────────────────────────────────────────────

interface QInputProps {
  q: Question;
  tOptions: string[] | null | undefined;
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'];
  watch: ReturnType<typeof useForm<Record<string, unknown>>>['watch'];
  setValue: ReturnType<typeof useForm<Record<string, unknown>>>['setValue'];
}

function QuestionInput({ q, tOptions, register, watch, setValue }: QInputProps) {
  const val = watch(q.id) as number | string | undefined;

  if (q.type === 'text') {
    return <Input placeholder="Your answer…" {...register(q.id)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />;
  }

  if (q.type === 'long_text') {
    return <Textarea placeholder="Your answer…" rows={4} {...register(q.id)} />;
  }

  if (q.type === 'yes_no') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setValue(q.id, opt)}
            className={`flex-1 py-3 rounded-xl border text-[14px] font-semibold transition-all ${
              val === opt
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'scale' || q.type === 'rating') {
    return (
      <div>
        <div className="flex justify-between text-[11px] text-[var(--text3)] mb-2">
          <span>{q.type === 'rating' ? 'Not painful' : 'Not at all'}</span>
          <span>{q.type === 'rating' ? 'Extremely painful' : 'Extremely'}</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue(q.id, n)}
              className={`py-3 sm:py-2 rounded-lg border text-[14px] sm:text-[13px] font-bold transition-all ${
                (val as number) === n
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_4px_12px_rgba(59,130,246,.3)]'
                  : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {val && <p className="text-center text-[13px] text-[var(--text2)] mt-2">Selected: <strong className="text-[var(--text)]">{val}</strong></p>}
      </div>
    );
  }

  if (q.type === 'choice' && q.options) {
    const displayOptions = tOptions ?? q.options;
    return (
      <div className="flex flex-col gap-2">
        {displayOptions.map((opt, i) => {
          const origOpt = q.options![i] ?? opt;
          return (
            <button
              key={origOpt}
              type="button"
              onClick={() => setValue(q.id, origOpt)}
              className={`text-left px-4 py-3 rounded-xl border text-[13px] transition-all ${
                val === origOpt
                  ? 'bg-[rgba(59,130,246,.1)] border-[var(--accent)] text-[var(--text)]'
                  : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === 'multi_choice' && q.options) {
    const displayOptions = tOptions ?? q.options;
    const selected = (val as string[] | undefined) ?? [];
    return (
      <div className="flex flex-col gap-2">
        {displayOptions.map((opt, i) => {
          const origOpt = q.options![i] ?? opt;
          const isSelected = selected.includes(origOpt);
          return (
            <button
              key={origOpt}
              type="button"
              onClick={() => {
                const next = isSelected ? selected.filter((s) => s !== origOpt) : [...selected, origOpt];
                setValue(q.id, next);
              }}
              className={`text-left px-4 py-3 rounded-xl border text-[13px] transition-all flex items-center gap-3 ${
                isSelected
                  ? 'bg-[rgba(59,130,246,.1)] border-[var(--accent)] text-[var(--text)]'
                  : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)]'
              }`}
            >
              <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                {isSelected && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              {opt}
            </button>
          );
        })}
        {selected.length > 0 && (
          <p className="text-[11px] text-[var(--text3)]">{selected.length} selected</p>
        )}
      </div>
    );
  }

  return <Input placeholder="Your answer…" {...register(q.id)} />;
}
