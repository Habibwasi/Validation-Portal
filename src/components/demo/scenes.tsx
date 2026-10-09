import type { CSSProperties, ReactNode } from 'react';
import {
  Trash2, Copy, ExternalLink, CheckCircle2, Plus, ClipboardList, TrendingUp, BarChart2, CheckCircle,
  ChevronDown, ChevronUp, XCircle, Brain, Lightbulb, Archive, Sun, Moon, ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Browser, Shell, PageHead, ModalBox, Field, Checkbox, Cursor, Toast } from './engine';
import { appear, between, clamp, easeOut, fade, lerp, prog, typed, LIGHT_VARS, type CursorKey } from './motion';
import {
  HOST, PROJECT, DESC, SLUG, SURVEY_URL, PID, WELCOME, THANKYOU, NOW, day,
  Q_PAIN, Q_STORY, Q_FREQ, Q_MISSED, Q_TRIED, FINAL_QS, BIASED_LABEL, FIXED_LABEL,
  H1, H2, MAYA_QUOTE, MAYA_TAGS, MAYA_NOTES, MAYA, JORDAN, PRIYA, LEO, ANALYSIS, type Q,
} from './story';
import {
  SurveyPage, DashboardPage, Stat, HypothesisCard, InterviewsHead, HowItWorks, InterviewRow, SortTabs,
  SelectBox, AnalysisBody, HypothesisAssessment, ResultsHead,
} from './replicas';

// ── Scene type ───────────────────────────────────────────────────────────────

export interface Scene {
  id: string;
  chapter: string;
  duration: number;
  captions: { at: number; text: string }[];
  render: (t: number) => ReactNode;
}

const projectUrl = (sub = '') => `${HOST}/p/${PID}${sub}`;

// ── Scenes ───────────────────────────────────────────────────────────────────

const intro: Scene = {
  id: 'intro', chapter: 'Start', duration: 7,
  captions: [
    { at: 0, text: 'Every idea starts with an open question.' },
    { at: 3.4, text: 'Validate Portal helps you answer it with evidence — before you build.' },
  ],
  render: (t) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,.10),transparent_55%),var(--bg)]">
      <p className="text-[56px] font-black leading-tight" style={appear(t, 0.3, 16)}>You have an idea.</p>
      <p className="text-[56px] font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" style={appear(t, 1.5, 16)}>
        But does anyone actually want it?
      </p>
      <div className="mt-14 text-center" style={appear(t, 3.5, 16)}>
        <div className="font-black text-[28px] tracking-wider uppercase">Validate</div>
        <div className="text-[12px] text-[var(--text3)] tracking-wider">Idea Validator</div>
      </div>
    </div>
  ),
};

const signup: Scene = {
  id: 'signup', chapter: 'Start', duration: 8,
  captions: [
    { at: 0, text: 'Create an account in seconds — or try it as a guest, no sign-up needed.' },
    { at: 5.0, text: 'Confirm your email, sign in, and you\'re ready to go.' },
  ],
  render: (t) => {
    const captcha = t < 4.2 ? 'idle' : t < 4.7 ? 'checking' : 'ok';
    const keys: CursorKey[] = [
      { at: 0.2, to: [900, 620] }, { at: 0.6, to: 'su-email', click: true }, { at: 2.1, to: 'su-pass', click: true },
      { at: 3.0, to: 'su-confirm', click: true }, { at: 4.2, to: 'su-captcha', click: true }, { at: 5.2, to: 'su-create', click: true },
      { at: 7.5, to: [880, 560] },
    ];
    return (
      <Browser url={`${HOST}/signup`}>
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,.06),transparent_40%),var(--bg)]">
          <div className="w-[384px] scale-[.88]">
            <div className="text-center mb-5">
              <div className="font-black text-[22px] tracking-wider uppercase mb-1">Validate</div>
              <p className="text-[var(--text2)] text-[13px]">Create your researcher account</p>
            </div>
            <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.05)] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,.4)]">
              <div className="flex flex-col gap-3">
                <Field c="su-email" label="Email" placeholder="you@example.com" value={typed('founder@shiftswap.app', t, 0.7, 20)} focused={between(t, 0.6, 2.1)} />
                <Field c="su-pass" label="Password" placeholder="••••••••" value={typed('••••••••••', t, 2.2, 18)} focused={between(t, 2.1, 3.0)} />
                <Field c="su-confirm" label="Confirm password" placeholder="••••••••" value={typed('••••••••••', t, 3.1, 18)} focused={between(t, 3.0, 4.0)} />
                <div className="h-[56px] rounded-md border border-[var(--border)] bg-[var(--surface2)] flex items-center gap-3 px-4 text-[13px]">
                  <span data-c="su-captcha" className="w-6 h-6 rounded border-2 border-[var(--text3)] flex items-center justify-center">
                    {captcha === 'checking' && <span className="w-3.5 h-3.5 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />}
                    {captcha === 'ok' && <CheckCircle2 size={18} className="text-[var(--green)]" />}
                  </span>
                  <span className="text-[var(--text2)]">{captcha === 'ok' ? 'Success!' : 'Verify you are human'}</span>
                </div>
                <Button variant="primary" size="lg" className="w-full mt-1" disabled={captcha !== 'ok'} loading={between(t, 5.2, 5.8)} data-c="su-create">
                  Create account
                </Button>
              </div>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[11px] uppercase tracking-wider text-[var(--text3)]">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <Button variant="outline" size="lg" className="w-full" disabled={captcha !== 'ok'}>Continue as guest</Button>
              <p className="text-center text-[11px] text-[var(--text3)] mt-2">No sign-up needed. Guest data is deleted after 7 days unless you save your account.</p>
            </div>
          </div>
        </div>
        <Toast t={t} from={5.9} to={8.2}>Account created — check your email to confirm.</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const newIdea: Scene = {
  id: 'idea', chapter: 'Start', duration: 9.5,
  captions: [
    { at: 0, text: 'Start a new idea: give it a name and describe the problem in plain language.' },
    { at: 5.8, text: 'Set how many conversations and survey responses you\'re aiming for.' },
  ],
  render: (t) => {
    const o = fade(t, 1.1, 8.0, 0.3);
    const target = t < 6.2 ? '20' : t < 6.4 ? '1' : '15';
    const keys: CursorKey[] = [
      { at: 0.2, to: [700, 380] }, { at: 0.8, to: 'new-idea', click: true }, { at: 1.5, to: 'idea-name', click: true },
      { at: 2.8, to: 'idea-desc', click: true }, { at: 6.0, to: 'idea-target', click: true }, { at: 7.5, to: 'lets-go', click: true },
      { at: 9.2, to: [800, 500] },
    ];
    return (
      <Browser url={`${HOST}/app`}>
        <Shell active="ideas">
          <div className="p-8">
            <PageHead title="Your Ideas" subtitle="Pick an idea to work on, or start validating a new one."
              actions={<Button variant="primary" data-c="new-idea"><Plus size={15} /> Start a new idea</Button>} />
            <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-6">
              <span className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white">Active</span>
              <span className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--text2)]">Archived</span>
            </div>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-4xl mb-4 opacity-40">🚀</div>
              <p className="font-semibold mb-1">You haven't started yet — that's okay</p>
              <p className="text-[12px] text-[var(--text3)] max-w-xs mb-4">Add your first idea and we'll help you find out if people actually want it.</p>
              <Button variant="primary"><Plus size={14} /> Start a new idea</Button>
            </div>
          </div>
        </Shell>
        <ModalBox o={o} title="What's your idea?" footer={<>
          <Button variant="ghost">Never mind</Button>
          <Button variant="primary" loading={between(t, 7.5, 8.0)} data-c="lets-go">Let's go</Button>
        </>}>
          <div className="flex flex-col gap-4">
            <Field c="idea-name" label="What are you calling it?" required placeholder="e.g. My remittance app" value={typed(PROJECT, t, 1.6, 16)} focused={between(t, 1.5, 2.8)} />
            <Field c="idea-desc" label="What problem does it solve?" rows={3} placeholder="Describe the problem and who has it — in plain language" value={typed(DESC, t, 2.9, 32)} focused={between(t, 2.8, 6.0)} />
            <div className="grid grid-cols-2 gap-3">
              <Field c="idea-target" label="How many conversations do you want?" value={target} focused={between(t, 6.0, 7.4)} />
              <Field label="How many survey responses?" value="50" />
            </div>
          </div>
        </ModalBox>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const onboarding: Scene = {
  id: 'onboarding', chapter: 'Start', duration: 8,
  captions: [
    { at: 0, text: 'A short onboarding walks you through your first steps…' },
    { at: 3.6, text: '…build a survey, share it, and log your first conversation.' },
  ],
  render: (t) => {
    const o = fade(t, 0.4, 6.8, 0.3);
    const step = t < 3.3 ? 0 : 1;
    const steps = ['Name your idea', 'Add a question', 'Share your survey'];
    const keys: CursorKey[] = [{ at: 0.3, to: [820, 560] }, { at: 3.2, to: 'wiz-next', click: true }, { at: 6.2, to: 'wiz-open', click: true }, { at: 7.6, to: [700, 450] }];
    return (
      <Browser url={projectUrl()}>
        <Shell active="dashboard" project={PROJECT}>
          <DashboardPage conv={0} surveys={0} pain={0} concept={0} pilot={0} painAvg={0} />
        </Shell>
        {o > 0 && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" style={{ opacity: o }}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,.5)] overflow-hidden">
              <div className="h-1 bg-[var(--bg2)]">
                <div className="h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
              <div className="flex items-center justify-center gap-2 pt-5 px-6">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold',
                      i < step ? 'bg-[var(--accent)] text-white' : i === step ? 'bg-[var(--accent)] text-white ring-4 ring-[rgba(59,130,246,.2)]' : 'bg-[var(--bg2)] text-[var(--text3)]')}>
                      {i < step ? <CheckCircle2 size={13} /> : i + 1}
                    </div>
                    <span className={cn('text-[12px]', i === step ? 'font-medium' : 'text-[var(--text3)]')}>{s}</span>
                    {i < 2 && <div className={cn('w-6 h-px mx-1', i < step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')} />}
                  </div>
                ))}
              </div>
              <div className="px-6 pt-6 pb-4 text-center">
                {step === 0 ? (
                  <>
                    <div className="text-4xl mb-3">🚀</div>
                    <h2 className="text-[18px] font-bold mb-2">Your idea is live!</h2>
                    <p className="text-[13px] text-[var(--text2)] mb-1">You just created <span className="font-semibold text-[var(--text)]">"{PROJECT}"</span>.</p>
                    <p className="text-[13px] text-[var(--text2)] mb-5">Now let's set up your survey so you can start collecting real signals from real people.</p>
                    <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 text-left mb-5">
                      <p className="text-[12px] text-[var(--text3)] font-medium uppercase tracking-wide mb-2">Your next steps</p>
                      {[['📋', 'Add at least one question to your survey'], ['🔗', 'Copy the survey link and share it'], ['🎙️', 'Log your first customer conversation']].map(([i, s]) => (
                        <div key={s} className="flex items-center gap-2 mb-1 text-[13px] text-[var(--text2)]"><span>{i}</span>{s}</div>
                      ))}
                    </div>
                    <Button variant="primary" className="w-full" data-c="wiz-next">Got it, let's go <ArrowRight size={14} /></Button>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">📋</div>
                    <h2 className="text-[18px] font-bold mb-2">Build your survey</h2>
                    <p className="text-[13px] text-[var(--text2)] mb-5">Add questions to measure pain, enthusiasm, and willingness to pay. One question is enough to start.</p>
                    <div className="bg-[rgba(59,130,246,.06)] border border-[rgba(59,130,246,.2)] rounded-xl p-4 text-left mb-5">
                      <p className="text-[12px] font-medium text-[var(--accent)] mb-2">💡 Good first questions</p>
                      {['"How painful is this problem for you?" (1–10 scale)', '"Would you pay for a solution?" (Yes/No)', '"How would you describe the problem in your own words?" (Open text)'].map((q) => (
                        <p key={q} className="text-[12px] text-[var(--text2)]">• {q}</p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1">Skip for now</Button>
                      <Button variant="primary" className="flex-1" data-c="wiz-open">Open Survey Builder <ExternalLink size={13} /></Button>
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 pb-5 text-center text-[11px] text-[var(--text3)]">Skip onboarding</div>
            </div>
          </div>
        )}
        <Toast t={t} from={-1} to={2.6}>You're off to a great start!</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const ROW = 80;

const survey: Scene = {
  id: 'survey', chapter: 'Survey', duration: 22,
  captions: [
    { at: 0, text: 'In the Survey Builder, AI drafts questions from your idea\'s description.' },
    { at: 5.2, text: 'Drag to reorder — put the question that matters most first.' },
    { at: 8.2, text: 'Check for bias: every question is scored against The Mom Test.' },
    { at: 12.8, text: 'Rewrite anything leading or hypothetical, then save to update the live survey.' },
  ],
  render: (t) => {
    const shown = t >= 3.2;
    const reordered = t >= 7.2;
    const momDone = t >= 10.2;
    const edited = t >= 16.9;
    const dp = reordered ? 0 : prog(t, 6.0, 0.9);
    const dragging = between(t, 5.6, 7.2);
    const q5: Q = { ...Q_TRIED, label: edited ? FIXED_LABEL : BIASED_LABEL };
    const order = reordered ? [Q_PAIN, Q_STORY, Q_FREQ, Q_MISSED, q5] : [Q_STORY, Q_PAIN, Q_FREQ, Q_MISSED, q5];
    const rows = shown ? order.map((q, i) => ({
      q,
      mom: momDone ? (q.id === 'q5' ? (edited ? undefined : 'bad' as const) : 'good' as const) : undefined,
      fixedH: !momDone,
      style: {
        ...appear(t, 3.2 + i * 0.15),
        ...(q.id === 'q2' && dragging ? { transform: `translateY(${-dp * ROW}px)`, opacity: 0.5, zIndex: 2 } : {}),
        ...(q.id === 'q1' && dragging ? { transform: `translateY(${dp * ROW}px)` } : {}),
      } as CSSProperties,
    })) : [];
    const scroll = prog(t, 10.4, 1.0) * 410 - prog(t, 17.6, 0.7) * 410;
    const mo = fade(t, 13.3, 17.1, 0.3);
    const label = t < 14.3 ? BIASED_LABEL : typed(FIXED_LABEL, t, 14.4, 32);
    const keys: CursorKey[] = [
      { at: 0.3, to: [760, 420] }, { at: 1.0, to: 'gen', click: true }, { at: 5.6, to: 'grip-q2', click: true }, { at: 6.9, to: 'grip-q2' },
      { at: 8.4, to: 'bias', click: true }, { at: 13.0, to: 'edit-q5', click: true }, { at: 14.0, to: 'q-text', click: true },
      { at: 16.8, to: 'q-save', click: true }, { at: 18.6, to: 'save', click: true }, { at: 21.2, to: [900, 520] },
    ];
    return (
      <Browser url={projectUrl('/survey')}>
        <Shell active="survey" project={PROJECT} scroll={scroll}>
          <SurveyPage
            rows={rows}
            generating={between(t, 1.0, 3.2)}
            checking={between(t, 8.4, 10.2)}
            saving={between(t, 18.6, 19.4)}
            dirty={shown && t < 19.4}
            momBanner={momDone}
          />
        </Shell>
        <ModalBox o={mo} title="Edit question" footer={<>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" data-c="q-save">Save changes</Button>
        </>}>
          <div className="flex flex-col gap-4">
            <SelectBox label="Question type" value="Yes / No — Binary question" />
            <Field c="q-text" label="Question text" required rows={2} value={label} focused={between(t, 14.0, 16.7)} />
            <label className="flex items-center gap-2 text-[13px]"><Checkbox checked /> Required question</label>
          </div>
        </ModalBox>
        <Toast t={t} from={3.3} to={6.0}>5 questions generated — press Save to apply</Toast>
        <Toast t={t} from={10.3} to={12.9} icon="warn">1 problematic · 0 warnings — see below</Toast>
        <Toast t={t} from={17.1} to={18.5}>Question updated</Toast>
        <Toast t={t} from={19.5} to={22.2}>Survey saved!</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const settings: Scene = {
  id: 'settings', chapter: 'Survey', duration: 12,
  captions: [
    { at: 0, text: 'Settings let you customise the survey\'s welcome and thank-you messages…' },
    { at: 3.8, text: '…map questions to the metrics on your dashboard…' },
    { at: 6.6, text: '…and offer the survey in other languages, translated by AI.' },
  ],
  render: (t) => {
    const tab = t < 3.8 ? 'survey' : t < 6.6 ? 'analytics' : 'languages';
    const langs = [['ar', '🇸🇦', 'Arabic'], ['bn', '🇧🇩', 'Bengali'], ['fr', '🇫🇷', 'French'], ['es', '🇪🇸', 'Spanish'], ['tr', '🇹🇷', 'Turkish'], ['hi', '🇮🇳', 'Hindi'], ['da', '🇩🇰', 'Danish'], ['de', '🇩🇪', 'German']];
    const on = (code: string) => (code === 'fr' && t >= 7.3) || (code === 'es' && t >= 7.8);
    const enabled = (t >= 7.3 ? 1 : 0) + (t >= 7.8 ? 1 : 0);
    const keys: CursorKey[] = [
      { at: 0.3, to: [860, 300] }, { at: 0.7, to: 'welcome', click: true }, { at: 3.8, to: 'tab-analytics', click: true },
      { at: 4.6, to: 'chip-pain', click: true }, { at: 5.6, to: 'concept', click: true }, { at: 6.6, to: 'tab-languages', click: true },
      { at: 7.3, to: 'lang-fr', click: true }, { at: 7.8, to: 'lang-es', click: true }, { at: 8.6, to: 'save-settings', click: true },
      { at: 9.6, to: 'translate', click: true }, { at: 11.6, to: [900, 560] },
    ];
    return (
      <Browser url={projectUrl('/settings')}>
        <Shell active="settings" project={PROJECT}>
          <div className="p-6 max-w-2xl mx-auto">
            <PageHead title="Project Settings" subtitle="Configure how your survey works and which questions map to your validation metrics" />
            <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-full mb-6">
              {['general', 'survey', 'analytics', 'languages', 'danger'].map((k) => (
                <span key={k} data-c={`tab-${k}`} className={cn('flex-1 text-center px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize',
                  tab === k ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]' : 'text-[var(--text2)]')}>
                  {k}
                </span>
              ))}
            </div>
            <div className="space-y-6">
              {tab === 'survey' && (
                <Card accent="green" className="p-5">
                  <CardTitle>Survey Copy</CardTitle>
                  <p className="text-[12px] text-[var(--text3)] mb-4">Customise the text shown to respondents on the public survey page.</p>
                  <div className="space-y-4">
                    <Field c="welcome" label="Welcome Message" rows={2} hint="Shown at the top of the survey. Max 300 characters."
                      placeholder="e.g. This takes ~3 minutes and helps us build something you'll actually love." value={typed(WELCOME, t, 0.9, 34)} focused={between(t, 0.7, 2.9)} />
                    <Field label="Thank-You Message" rows={2} hint="Shown after submission. Max 300 characters."
                      placeholder="e.g. Your response has been recorded — thank you for shaping this idea!" value={typed(THANKYOU, t, 2.9, 110)} focused={between(t, 2.9, 3.7)} />
                  </div>
                </Card>
              )}
              {tab === 'analytics' && (
                <Card accent="blue" className="p-5">
                  <CardTitle>Metric Mapping</CardTitle>
                  <div className="flex items-start gap-3 bg-[rgba(245,158,11,.08)] border border-[rgba(245,158,11,.3)] rounded-xl px-4 py-3 mb-4">
                    <span className="text-amber-400 flex-shrink-0">⚠️</span>
                    <p className="text-[12px] text-[var(--text2)] leading-relaxed">This is what powers the <strong className="text-[var(--text)]">Feel the Pain %</strong> and <strong className="text-[var(--text)]">Want a Solution %</strong> stats on your dashboard. Without mapping questions here, those cards will always show 0%.</p>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <div className="text-[12px] font-semibold text-[var(--text2)] mb-2">Pain / Rating Questions <span className="ml-1.5 text-[var(--text3)] font-normal">(used for pain score averages)</span></div>
                      <span data-c="chip-pain" className={cn('inline-flex items-center px-3 py-1.5 rounded-lg border text-[12px]',
                        t >= 4.6 ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text3)]')}>
                        {t >= 4.6 && <span className="mr-1">✓</span>}
                        {Q_PAIN.label.slice(0, 40)}…<Badge variant="blue" size="sm" className="ml-1.5">rating</Badge>
                      </span>
                    </div>
                    <SelectBox c="concept" label="Concept Interest Question" hint="A Yes/No question — % who answer 'Yes' = concept interest rate"
                      value={t >= 5.8 ? FIXED_LABEL : '— none —'} focused={between(t, 5.6, 6.4)} />
                    <SelectBox label="Pilot Ready Question" hint="A Yes/No question — 'Yes' answers count toward pilot ready metric" value="— none —" />
                  </div>
                </Card>
              )}
              {tab === 'languages' && (
                <Card accent="blue" className="p-5">
                  <CardTitle>Survey Languages</CardTitle>
                  <p className="text-[12px] text-[var(--text3)] mb-4">Enable languages to let respondents take the survey in their preferred language.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-lg border text-[12px] flex items-center gap-1.5 bg-[rgba(59,130,246,.12)] border-[var(--accent)] opacity-60">
                      🇬🇧 English <Badge variant="blue" size="sm">always on</Badge>
                    </span>
                    {langs.map(([code, flag, name]) => (
                      <span key={code} data-c={`lang-${code}`} className={cn('px-3 py-1.5 rounded-lg border text-[12px] flex items-center gap-1.5',
                        on(code) ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text3)]')}>
                        {flag} {name}{on(code) && <span className="text-[var(--accent)] font-bold ml-0.5">✓</span>}
                      </span>
                    ))}
                  </div>
                  {enabled > 0 && <p className="text-[11px] text-[var(--text3)] mt-3">{enabled} language{enabled > 1 ? 's' : ''} enabled — remember to save, then generate translations.</p>}
                  <div className="mt-4 flex items-center gap-3">
                    <Button variant="secondary" size="sm" disabled={enabled === 0} loading={between(t, 9.6, 10.4)} data-c="translate">✦ Generate Translations</Button>
                    <p className="text-[11px] text-[var(--text3)]">Translations are saved per-question and used automatically on the survey.</p>
                  </div>
                </Card>
              )}
              <div className="flex justify-end"><Button variant="primary" loading={between(t, 8.6, 8.9)} data-c="save-settings">Save Settings</Button></div>
            </div>
          </div>
        </Shell>
        <Toast t={t} from={8.9} to={9.9}>Settings saved</Toast>
        <Toast t={t} from={10.5} to={12.3}>Translated 5 question(s) into 2 language(s)</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const savedRows = () => FINAL_QS.map((q) => ({ q }));

const share: Scene = {
  id: 'share', chapter: 'Survey', duration: 8,
  captions: [
    { at: 0, text: 'Share one public link — copy it, preview it, or print a QR code.' },
    { at: 3.4, text: 'Respondents don\'t need an account to answer.' },
  ],
  render: (t) => {
    const keys: CursorKey[] = [{ at: 0.2, to: [760, 420] }, { at: 0.8, to: 'copy', click: true }, { at: 3.0, to: 'qr', click: true }, { at: 7.6, to: [900, 600] }];
    return (
      <Browser url={projectUrl('/survey')}>
        <Shell active="survey" project={PROJECT}>
          <SurveyPage rows={savedRows()} />
        </Shell>
        <ModalBox o={fade(t, 3.3, 8.4, 0.3)} title="📱 Survey QR Code">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[12px] text-[var(--text2)] text-center">Let people scan this with their phone to open the survey directly — no typing needed.</p>
            <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.3)]">
              <QRCodeSVG value={SURVEY_URL} size={190} bgColor="#ffffff" fgColor="#0f172a" level="M" />
            </div>
            <p className="text-[11px] text-[var(--text3)] text-center">{SURVEY_URL}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary"><Copy size={13} /> Copy link</Button>
              <Button size="sm" variant="primary">⬇ Download SVG</Button>
            </div>
          </div>
        </ModalBox>
        <Toast t={t} from={1.0} to={2.7}>Copied!</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const PAIN_ES = '¿Qué tan difícil es encontrar a alguien que cubra tu turno?';

const respondent: Scene = {
  id: 'respondent', chapter: 'Responses', duration: 14,
  captions: [
    { at: 0, text: 'Respondents answer one question at a time, in the language they choose.' },
    { at: 8.9, text: 'They can step back to change an answer before submitting.' },
    { at: 11.8, text: 'Every submission lands in your project instantly.' },
  ],
  render: (t) => {
    const step = t < 3.8 ? 0 : t < 6.8 ? 1 : t < 8.1 ? 2 : t < 9.3 ? 3 : t < 9.9 ? 2 : t < 10.4 ? 3 : 4;
    const submitted = t >= 12.0;
    const lang = between(t, 0.9, 2.3) ? 'es' : 'en';
    const q = FINAL_QS[step];
    const progress = Math.round((step / 5) * 100);
    const story = typed('Posted in the group chat and waited hours.', t, 4.3, 22);
    const keys: CursorKey[] = [
      { at: 0.2, to: [900, 300] }, { at: 0.6, to: 'r-lang-es', click: true }, { at: 2.2, to: 'r-lang-en', click: true },
      { at: 3.0, to: 'r-8', click: true }, { at: 3.8, to: 'r-next', click: true }, { at: 4.1, to: 'r-text', click: true },
      { at: 6.8, to: 'r-next', click: true }, { at: 7.5, to: 'r-weekly', click: true }, { at: 8.1, to: 'r-next', click: true },
      { at: 8.8, to: 'r-yes', click: true }, { at: 9.3, to: 'r-back', click: true }, { at: 9.9, to: 'r-next', click: true },
      { at: 10.4, to: 'r-next', click: true }, { at: 11.0, to: 'r-no', click: true }, { at: 11.6, to: 'r-submit', click: true },
      { at: 13.6, to: [900, 420] },
    ];
    const opt = (on: boolean) => on
      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)]';
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,.08),transparent_55%),var(--bg)]">
        <div className="absolute left-[110px] top-[250px] w-[300px] space-y-3" style={appear(t, 0.2)}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">Respondent view</div>
          <div className="text-[26px] font-black leading-tight">No login.<br />Just answers.</div>
          <div className="inline-block font-mono text-[12px] text-[var(--accent2)] bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5">/s/{SLUG}</div>
        </div>
        <div className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[340px] h-[672px] rounded-[46px] border-[10px] border-[#26211c] bg-[var(--bg)] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-[#26211c] z-10" />
          <div className="absolute inset-0 px-4 pt-14 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,.07),transparent_40%),var(--bg)]">
            {submitted ? (
              <div className="h-full flex items-center justify-center text-center pb-20" style={appear(t, 12.0)}>
                <div>
                  <div className="text-5xl mb-6">🙏</div>
                  <h1 className="font-black text-2xl mb-3">Thank you!</h1>
                  <p className="text-[var(--text2)] text-[14px]">{THANKYOU}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="font-black text-[18px] tracking-wider uppercase mb-2">{PROJECT}</div>
                  <p className="text-[var(--text2)] text-[13px] leading-snug">{WELCOME}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {[['en', '🇬🇧', 'English'], ['fr', '🇫🇷', 'French'], ['es', '🇪🇸', 'Spanish']].map(([code, flag, name]) => (
                      <span key={code} data-c={`r-lang-${code}`} className={cn('px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1',
                        lang === code ? 'bg-[rgba(59,130,246,.12)] border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text3)]')}>
                        {flag}{name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] text-[var(--text3)] mb-1.5"><span>Question {step + 1} of 5</span><span>{progress}%</span></div>
                  <ProgressBar value={progress} height={5} className="w-full" />
                </div>
                <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.04)] rounded-2xl p-4 shadow-[0_24px_60px_rgba(0,0,0,.3)]">
                  <div className="flex flex-col gap-4">
                    <h2 className="font-bold text-[15px] leading-snug">{step === 0 && lang === 'es' ? PAIN_ES : q.label}</h2>
                    {q.type === 'rating' && (
                      <div>
                        <div className="flex justify-between text-[11px] text-[var(--text3)] mb-2"><span>Not painful</span><span>Extremely painful</span></div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <span key={n} data-c={`r-${n}`} className={cn('py-3 rounded-lg border text-[14px] font-bold text-center', opt(n === 8 && t >= 3.0))}>{n}</span>
                          ))}
                        </div>
                        {t >= 3.0 && <p className="text-center text-[13px] text-[var(--text2)] mt-2">Selected: <strong className="text-[var(--text)]">8</strong></p>}
                      </div>
                    )}
                    {q.type === 'long_text' && (
                      <Field c="r-text" rows={4} placeholder="Your answer…" value={story} focused={between(t, 4.1, 6.8)} />
                    )}
                    {q.type === 'choice' && (
                      <div className="flex flex-col gap-2">
                        {q.options!.map((o) => (
                          <span key={o} data-c={o === 'Weekly' ? 'r-weekly' : undefined} className={cn('px-4 py-2.5 rounded-xl border text-[13px]',
                            o === 'Weekly' && t >= 7.5 ? 'bg-[rgba(59,130,246,.1)] border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text2)]')}>{o}</span>
                        ))}
                      </div>
                    )}
                    {q.type === 'yes_no' && (
                      <div className="flex gap-3">
                        {['Yes', 'No'].map((o) => {
                          const picked = step === 3 ? (o === 'Yes' && t >= 8.8) : (o === 'No' && t >= 11.0);
                          return <span key={o} data-c={`r-${o.toLowerCase()}`} className={cn('flex-1 py-3 rounded-xl border text-[14px] font-semibold text-center', opt(picked))}>{o}</span>;
                        })}
                      </div>
                    )}
                    <div className="flex justify-between mt-1">
                      {step > 0 ? <Button variant="ghost" data-c="r-back">← Back</Button> : <div />}
                      {step < 4
                        ? <Button variant="primary" data-c="r-next">Next →</Button>
                        : <Button variant="primary" data-c="r-submit" loading={between(t, 11.6, 12.0)}>Submit</Button>}
                    </div>
                  </div>
                </div>
                <p className="text-center text-[11px] text-[var(--text3)] mt-4">Powered by <span className="text-[var(--accent2)]">Validate Portal</span></p>
              </>
            )}
          </div>
        </div>
        <Cursor t={t} keys={keys} />
      </div>
    );
  },
};

const responses: Scene = {
  id: 'responses', chapter: 'Responses', duration: 5.5,
  captions: [{ at: 0, text: 'Back in the Survey Builder, open any response to read every answer.' }],
  render: (t) => {
    const keys: CursorKey[] = [{ at: 0.2, to: [800, 300] }, { at: 1.2, to: 'response-row', click: true }, { at: 5.2, to: [900, 560] }];
    return (
      <Browser url={projectUrl('/survey')}>
        <Shell active="survey" project={PROJECT} scroll={330 + prog(t, 1.4, 0.8) * 170}>
          <SurveyPage rows={savedRows()} responses={1} expanded={t >= 1.3} />
        </Shell>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const hypothesis: Scene = {
  id: 'hypothesis', chapter: 'Conversations', duration: 8.5,
  captions: [
    { at: 0, text: 'Write down what must be true for the idea to work, as a testable hypothesis.' },
    { at: 4.5, text: 'The template builds the sentence for you as you type.' },
  ],
  render: (t) => {
    const tab = t < 0.8 ? 'conversations' : 'hypotheses';
    const added = t >= 6.2;
    const c = typed(H1.customer, t, 1.95, 34);
    const p = typed(H1.problem, t, 2.95, 34);
    const pr = typed(H1.price, t, 3.95, 30);
    const s = typed(H1.solution, t, 4.45, 34);
    const keys: CursorKey[] = [
      { at: 0.2, to: [760, 300] }, { at: 0.8, to: 'tab-hyp', click: true }, { at: 1.5, to: 'add-h', click: true },
      { at: 1.9, to: 'h-customer', click: true }, { at: 2.9, to: 'h-problem', click: true }, { at: 3.9, to: 'h-price', click: true },
      { at: 4.4, to: 'h-solution', click: true }, { at: 6.0, to: 'h-save', click: true }, { at: 8.2, to: [880, 560] },
    ];
    return (
      <Browser url={projectUrl('/interviews')}>
        <Shell active="interviews" project={PROJECT}>
          <div className="p-8">
            <InterviewsHead tab={tab} convCount={3} hypCount={added ? 1 : 0} />
            {tab === 'conversations' ? (
              <>
                <SortTabs sort="date" />
                <div className="flex flex-col gap-2">{[JORDAN, PRIYA, LEO].map((iv) => <InterviewRow key={iv.id} iv={iv} />)}</div>
              </>
            ) : (
              <>
                <HowItWorks />
                {added ? (
                  <HypothesisCard n={1} h={H1} status="untested" linked={[]} id="h1" style={appear(t, 6.2)} />
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Lightbulb size={32} className="mb-4 opacity-40" />
                    <p className="font-semibold mb-1">No hypotheses yet</p>
                    <p className="text-[12px] text-[var(--text3)] max-w-xs mb-4">Start by writing down your most important assumption — what must be true for this idea to work?</p>
                    <Button variant="primary"><Plus size={14} /> Add my first hypothesis</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Shell>
        <ModalBox o={fade(t, 1.8, 6.3, 0.3)} title="Add hypothesis H1" bodyHeight={430} bodyScroll={prog(t, 4.2, 0.4) * 110} footer={<>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" data-c="h-save">Add hypothesis</Button>
        </>}>
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[var(--text3)]">Fill in the template below. The hypothesis sentence is built automatically from your inputs.</p>
            {c && p && s && (
              <div className="bg-[rgba(245,158,11,.06)] border border-[rgba(245,158,11,.2)] rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1">Preview</p>
                <p className="text-[13px] leading-relaxed italic">"I believe {c} has {p}{pr ? ` and will pay ${pr}` : ''} for {s}."</p>
              </div>
            )}
            <Field c="h-customer" label="Customer" required hint='Who has this problem? ("I believe ___")' placeholder="e.g. parents living abroad" value={c} focused={between(t, 1.9, 2.9)} />
            <Field c="h-problem" label="Problem" required hint='What pain do they have? ("has ___")' placeholder="e.g. no easy way to check on elderly family members" value={p} focused={between(t, 2.9, 3.9)} />
            <Field c="h-price" label="Price they'd pay" placeholder="e.g. £10–20/month" value={pr} focused={between(t, 3.9, 4.4)} />
            <Field c="h-solution" label="Solution" required placeholder="e.g. a daily wellness check-in app" value={s} focused={between(t, 4.4, 5.9)} />
          </div>
        </ModalBox>
        <Toast t={t} from={6.4} to={8.6}>Hypothesis added</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const conversation: Scene = {
  id: 'conversation', chapter: 'Conversations', duration: 14,
  captions: [
    { at: 0, text: 'After each conversation, log who you spoke to and whether they\'d use it.' },
    { at: 2.8, text: 'Score their pain, and capture their exact words as quotes.' },
    { at: 6.2, text: 'Add tags, link the hypotheses you tested, and keep private notes.' },
    { at: 10.2, text: 'Every conversation becomes evidence for your analysis.' },
  ],
  render: (t) => {
    const prompts = t < 1.1;
    const pain = t < 2.9 ? null : Math.round(lerp(5, 9, prog(t, 2.9, 0.7)));
    const thumb = t < 2.9 ? 0.5 : lerp(4 / 9, 8 / 9, prog(t, 2.9, 0.7));
    const saved = t >= 10.1;
    const bodyScroll = prog(t, 5.9, 0.4) * 200 + prog(t, 7.85, 0.3) * 110;
    const rows = saved ? [MAYA, JORDAN, PRIYA, LEO] : [JORDAN, PRIYA, LEO];
    const keys: CursorKey[] = [
      { at: 0.2, to: [800, 300] }, { at: 0.5, to: 'add-conv', click: true }, { at: 1.0, to: 'prompts', click: true },
      { at: 1.3, to: 'participant', click: true }, { at: 2.4, to: 'pilot', click: true }, { at: 2.9, to: 'slider-thumb', click: true },
      { at: 3.6, to: 'slider-thumb' }, { at: 4.1, to: 'add-quote', click: true }, { at: 6.3, to: 'tags', click: true },
      { at: 7.7, to: 'h1-check', click: true }, { at: 8.2, to: 'notes', click: true }, { at: 9.9, to: 'conv-save', click: true },
      { at: 11.2, to: 'row-maya', click: true }, { at: 13.6, to: [900, 600] },
    ];
    return (
      <Browser url={projectUrl('/interviews')}>
        <Shell active="interviews" project={PROJECT}>
          <div className="p-8">
            <InterviewsHead tab="conversations" convCount={rows.length} hypCount={1} />
            <SortTabs sort="date" />
            <div className="flex flex-col gap-2">
              {rows.map((iv) => <InterviewRow key={iv.id} iv={iv} expanded={iv.id === 'maya' && t >= 11.4} style={iv.id === 'maya' ? appear(t, 10.1) : undefined} />)}
            </div>
          </div>
        </Shell>
        <ModalBox o={fade(t, 0.75, 10.1, 0.3)} size="lg" title="Log a conversation" bodyHeight={500} bodyScroll={bodyScroll} footer={<>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" data-c="conv-save" loading={between(t, 9.9, 10.1)}>Save</Button>
        </>}>
          <div className="flex flex-col gap-4">
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              <div data-c="prompts" className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface2)] text-[12px] font-semibold text-[var(--text2)]">
                <span>💡 Suggested questions to ask</span>{prompts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {prompts && (
                <div className="px-4 py-3 flex flex-col gap-1.5 text-[12px] text-[var(--text2)]">
                  {['Can you walk me through the last time this happened?', 'What do you do today to deal with this problem?', 'How much time / money does this cost you right now?', "What's the most frustrating part of your current solution?"].map((q) => (
                    <div key={q} className="flex gap-2"><span className="text-[var(--accent)]">→</span>{q}</div>
                  ))}
                </div>
              )}
            </div>
            <Field c="participant" label="Who did you talk to?" required hint="First name + initial is enough — no personal data needed"
              placeholder="e.g. Ahmed D. (keep anonymous)" value={typed('Maya R.', t, 1.45, 18)} focused={between(t, 1.3, 2.3)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Interview date" required value={day(0)} />
              <label className="flex items-center gap-2 text-[13px] self-end py-2.5">
                <Checkbox c="pilot" checked={t >= 2.4} accent="var(--green)" />
                <CheckCircle size={14} className="text-[var(--green)]" /> Would use it (pilot-ready)
              </label>
            </div>
            <div>
              <div className="text-[13px] font-medium mb-0.5">Pain scores</div>
              <p className="text-[11px] text-[var(--accent2)] mb-2">⚡ These scores shape your AI verdict — rate honestly</p>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text2)] truncate">{Q_PAIN.label}</span>
                <span className={cn('text-[13px] font-bold w-10 text-right', pain ? 'text-[var(--red)]' : 'text-[var(--text3)]')}>{pain ? `${pain}/10` : '–'}</span>
              </div>
              <div className="relative h-4 my-1.5">
                <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5 rounded-full bg-[var(--border)]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${thumb * 100}%` }} />
                <div data-c="slider-thumb" className="absolute top-1/2 w-4 h-4 rounded-full bg-[var(--accent)] border-2 border-white -translate-x-1/2 -translate-y-1/2" style={{ left: `${thumb * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text3)]"><span>1 — no problem</span><span>10 — unbearable</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium">Key quotes</span>
                <Button size="sm" variant="ghost" data-c="add-quote"><Plus size={12} /> Add quote</Button>
              </div>
              {t >= 4.2 && (
                <div className="flex gap-2 mb-2 items-center">
                  <Field className="flex-1" placeholder="Quote 1" value={typed(MAYA_QUOTE, t, 4.4, 30)} focused={between(t, 4.2, 6.2)} />
                  <XCircle size={14} className="text-[var(--text3)] mx-2" />
                </div>
              )}
              <p className="text-[11px] text-[var(--accent2)]">💬 Exact words carry more weight than your summary</p>
            </div>
            <Field c="tags" label="Tags" hint="Comma-separated tags for filtering" placeholder="e.g. remittance, family-monitoring, pilot"
              value={typed(MAYA_TAGS, t, 6.4, 36)} focused={between(t, 6.3, 7.6)} />
            <div>
              <div className="text-[13px] font-medium mb-1.5">Which hypotheses did this test?</div>
              <label className="flex items-start gap-2.5 text-[12px] text-[var(--text2)]">
                <span className="mt-0.5"><Checkbox c="h1-check" checked={t >= 7.7} /></span>
                <span><span className="text-[11px] font-bold text-[var(--accent)] mr-1.5">H1</span>{H1.customer} · {H1.problem}</span>
              </label>
            </div>
            <Field c="notes" label="Notes" rows={3} placeholder="Additional observations, context, or follow-up items…"
              value={typed(MAYA_NOTES, t, 8.3, 36)} focused={between(t, 8.2, 9.8)} />
          </div>
        </ModalBox>
        <Toast t={t} from={10.3} to={12.8}>Nice, conversation saved!</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const sortScene: Scene = {
  id: 'sort', chapter: 'Conversations', duration: 5,
  captions: [{ at: 0, text: 'Sort by highest pain to see who feels the problem most.' }],
  render: (t) => {
    const byDate = [MAYA, JORDAN, PRIYA, LEO];
    const byPain = [MAYA, PRIYA, JORDAN, LEO];
    const p = prog(t, 1.0, 0.6);
    const keys: CursorKey[] = [{ at: 0.1, to: [760, 420] }, { at: 0.8, to: 'sort-pain', click: true }, { at: 4.6, to: [880, 520] }];
    return (
      <Browser url={projectUrl('/interviews')}>
        <Shell active="interviews" project={PROJECT}>
          <div className="p-8">
            <InterviewsHead tab="conversations" convCount={4} hypCount={1} />
            <SortTabs sort={t >= 0.8 ? 'pain' : 'date'} />
            <div className="flex flex-col gap-2">
              {byDate.map((iv, i) => (
                <InterviewRow key={iv.id} iv={iv} fixedH style={{ transform: `translateY(${(byPain.indexOf(iv) - i) * 72 * p}px)` }} />
              ))}
            </div>
          </div>
        </Shell>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const dashboard: Scene = {
  id: 'dashboard', chapter: 'Results', duration: 9,
  captions: [
    { at: 0, text: 'Two weeks later, the dashboard shows the signal building up.' },
    { at: 4.0, text: 'Progress toward your targets, pain levels, concept interest and pilot-ready leads.' },
  ],
  render: (t) => {
    const p = prog(t, 0.6, 2.6);
    const keys: CursorKey[] = [{ at: 3.6, to: [900, 460] }, { at: 7.6, to: 'data-say', click: true }];
    return (
      <Browser url={projectUrl()}>
        <Shell active="dashboard" project={PROJECT}>
          <DashboardPage
            conv={lerp(4, 12, p)} surveys={lerp(1, 47, p)} pain={lerp(50, 67, p)}
            concept={lerp(0, 64, p)} pilot={lerp(1, 5, p)} painAvg={lerp(6.8, 7.6, p)}
          />
        </Shell>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] text-[12px] font-semibold text-[var(--accent)]" style={{ opacity: fade(t, 0, 2.6, 0.4) }}>
          ⏩ Two weeks later
        </div>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const analysis: Scene = {
  id: 'analysis', chapter: 'Results', duration: 20,
  captions: [
    { at: 0, text: 'When you\'re ready, ask: what does my data say?' },
    { at: 3.6, text: 'The AI returns a verdict, themes, real quotes, next steps and warnings.' },
    { at: 8.8, text: 'Treat it as guidance drawn from your own data, not a guarantee.' },
    { at: 12.6, text: 'Its hypothesis verdicts only change anything if you choose to apply them.' },
    { at: 16.6, text: 'Export a full report with every interview and survey response.' },
  ],
  render: (t) => {
    const phase = t < 1.0 ? 'empty' : t < 3.6 ? 'generating' : 'result';
    const scroll = prog(t, 6.4, 5.6) * 560 - prog(t, 15.4, 0.8) * 560;
    const sheet = fade(t, 17.3, 21, 0.4);
    const keys: CursorKey[] = [
      { at: 0.2, to: [800, 300] }, { at: 1.0, to: 'analyse', click: true }, { at: 3.0, to: [880, 520] },
      { at: 13.2, to: 'apply', click: true }, { at: 16.8, to: 'export', click: true }, { at: 19.6, to: [1000, 600] },
    ];
    return (
      <Browser url={projectUrl('/analysis')}>
        <Shell active="analysis" project={PROJECT} scroll={scroll}>
          <div className="p-6 max-w-3xl mx-auto pb-16">
            <ResultsHead hasResult={phase === 'result'} generating={phase === 'generating'} />
            {phase === 'empty' && (
              <div className="flex flex-col items-center py-16 text-center">
                <Brain size={32} className="mb-4 opacity-40" />
                <p className="font-semibold mb-1">Nothing to analyse yet</p>
                <p className="text-[12px] text-[var(--text3)] max-w-xs mb-4">You've got 59 data points. Ready to see what it means?</p>
                <Button variant="primary">What does my data say?</Button>
              </div>
            )}
            {phase === 'generating' && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-[var(--text2)] text-[13px]">Reading through your conversations and survey responses…</p>
                <p className="text-[11px] text-[var(--text3)]">This usually takes about 10 seconds.</p>
              </div>
            )}
            {phase === 'result' && (
              <>
                <AnalysisBody t={t} from={3.6} />
                <HypothesisAssessment t={t} from={5.4} applying={between(t, 13.2, 13.8)} />
                <p className="text-center text-[11px] text-[var(--text3)] mt-6">Powered by Groq AI · Based on your current data · <span className="text-[var(--accent2)]">Run again</span></p>
              </>
            )}
          </div>
        </Shell>
        {sheet > 0 && (
          <div className="absolute inset-0 z-40 bg-black/60 flex justify-center pt-8" style={{ opacity: sheet }}>
            <div className="w-[600px] bg-white text-[#111] rounded-t-md shadow-2xl px-10 py-8" style={{ transform: `translateY(${(1 - sheet) * 40}px)` }}>
              <h1 className="text-[24px] font-black mb-1">{PROJECT}</h1>
              <p className="text-[12px] text-[#999] mb-1.5">{DESC}</p>
              <p className="text-[11px] text-[#bbb] mb-6">Generated {new Date(NOW).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} · 12 interviews · 47 survey responses</p>
              <p className="text-[17px] font-extrabold mb-4">AI Analysis</p>
              <div className="border border-[#e5e7eb] border-l-4 border-l-[#16a34a] rounded-[10px] p-5 mb-5">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-[#16a34a22] text-[#16a34a] border border-[#16a34a44] mb-2">Strong Signal</span>
                <p className="text-[14px] text-[#444] leading-relaxed">{ANALYSIS.summary}</p>
              </div>
              <h2 className="text-[11px] uppercase tracking-[.08em] text-[#888] border-t border-[#f3f4f6] pt-3 mb-2.5">Patterns we noticed</h2>
              {ANALYSIS.themes.slice(0, 2).map((th) => (
                <div key={th.title} className="border border-[#e5e7eb] rounded-lg p-3.5 mb-2.5">
                  <span className="font-bold text-[14px]">{th.title}</span>
                  <p className="text-[13px] text-[#555]">{th.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <Toast t={t} from={13.9} to={15.8}>1 hypothesis status updated</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const decide: Scene = {
  id: 'decide', chapter: 'Results', duration: 6,
  captions: [
    { at: 0, text: 'The applied verdict marked H1 as supported.' },
    { at: 2.2, text: 'The final call is always yours — supported, disproved, or pivoted.' },
  ],
  render: (t) => {
    const keys: CursorKey[] = [{ at: 0.2, to: [800, 260] }, { at: 2.2, to: 'st-h2-pivoted', click: true }, { at: 5.6, to: [900, 600] }];
    return (
      <Browser url={projectUrl('/interviews')}>
        <Shell active="interviews" project={PROJECT}>
          <div className="p-8">
            <InterviewsHead tab="hypotheses" convCount={12} hypCount={2} />
            <div className="flex flex-col gap-3">
              <HypothesisCard n={1} h={H1} status="supported" id="h1"
                linked={['Maya R.', 'Priya S.', 'Jordan K.', 'Sam T.', 'Ana P.', 'Noah B.', 'Lena F.', 'Omar H.', 'Kim L.']} />
              <HypothesisCard n={2} h={H2} status={t >= 2.2 ? 'pivoted' : 'untested'} id="h2" linked={['Dana W.', 'Chris B.']} />
            </div>
          </div>
        </Shell>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const publicLink: Scene = {
  id: 'public', chapter: 'Results', duration: 8.5,
  captions: [
    { at: 0, text: 'Share your results with a read-only link.' },
    { at: 3.0, text: 'Anyone with the link can view the report, so share it with care.' },
  ],
  render: (t) => {
    const isPublic = t >= 2.7;
    const keys: CursorKey[] = [{ at: 0.1, to: [760, 300] }, { at: 0.6, to: 'share', click: true }, { at: 2.4, to: [1100, 640] }];
    return (
      <Browser url={isPublic ? `${HOST}/a/${SLUG}` : projectUrl('/analysis')}>
        {!isPublic ? (
          <Shell active="analysis" project={PROJECT}>
            <div className="p-6 max-w-3xl mx-auto">
              <ResultsHead hasResult />
              <AnalysisBody t={t} from={-5} />
            </div>
          </Shell>
        ) : (
          <div className="absolute inset-0 overflow-hidden bg-[var(--bg)]" style={{ opacity: clamp((t - 2.7) / 0.35) }}>
            <div className="max-w-2xl mx-auto py-12 px-4" style={{ transform: `translateY(${-prog(t, 4.2, 4) * 330}px)` }}>
              <div className="text-center mb-8">
                <div className="text-[12px] font-semibold text-[var(--text3)] uppercase tracking-widest mb-1">Validation Report</div>
                <h1 className="font-black text-3xl">{PROJECT}</h1>
                <p className="text-[13px] text-[var(--text3)] mt-2">Shared read-only view · Powered by Validate Portal</p>
              </div>
              <AnalysisBody t={t} from={-5} publicView />
            </div>
          </div>
        )}
        <Toast t={t} from={0.9} to={2.6}>Link copied!</Toast>
        <Cursor t={t} keys={keys} />
      </Browser>
    );
  },
};

const montage: Scene = {
  id: 'montage', chapter: 'Wrap-up', duration: 8,
  captions: [{ at: 0, text: 'Switch between ideas, archive the ones you\'ve moved on from, and work in light or dark mode.' }],
  render: (t) => {
    const open = between(t, 1.0, 2.4);
    const switched = t >= 2.4;
    const archived = t >= 3.2;
    const archTab = t >= 4.6;
    const light = t >= 5.6;
    const keys: CursorKey[] = [
      { at: 0.2, to: [640, 640] }, { at: 1.0, to: 'm-switch', click: true }, { at: 1.8, to: 'm-opt2' }, { at: 2.4, to: 'm-opt2', click: true },
      { at: 3.2, to: 'm-archive', click: true }, { at: 4.6, to: 'm-tab-archived', click: true }, { at: 5.6, to: 'm-theme', click: true },
      { at: 7.6, to: [1000, 640] },
    ];
    const tile = 'relative w-[360px] h-[400px] rounded-2xl border border-[var(--border)] bg-[var(--bg2)] overflow-hidden p-6';
    const tab = (on: boolean) => cn('px-4 py-1.5 rounded-lg text-[12px] font-semibold', on ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white' : 'text-[var(--text2)]');
    return (
      <div className="absolute inset-0 flex items-center justify-center gap-8 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,.07),transparent_55%),var(--bg)]">
        <div style={appear(t, 0)}>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-3">Switch ideas</p>
          <div className={tile}>
            <div className="text-[10px] text-[var(--text3)] tracking-wider mb-4 flex items-center gap-1.5">‹ All ideas</div>
            <div data-c="m-switch" className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-3 py-2.5">
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Project</div>
              <div className="flex items-center justify-between text-[13px] font-semibold">{switched ? 'Meal-prep for night shifts' : PROJECT}<ChevronDown size={11} className="text-[var(--text3)]" /></div>
            </div>
            {open && (
              <div className="mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1 text-[13px] shadow-xl">
                {[PROJECT, 'Meal-prep for night shifts', 'Tutor matching for parents'].map((n, i) => (
                  <div key={n} data-c={i === 1 ? 'm-opt2' : undefined} className={cn('px-3 py-1.5', i === 1 && t >= 1.8 ? 'bg-[var(--accent)] text-white' : '')}>{n}</div>
                ))}
              </div>
            )}
            <p className="absolute bottom-6 left-6 right-6 text-[12px] text-[var(--text3)]">You stay on the same page — Dashboard, Survey or Results — when you switch.</p>
          </div>
        </div>
        <div style={appear(t, 0.2)}>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-3">Archive & restore</p>
          <div className={tile}>
            <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-4">
              <span className={tab(!archTab)}>Active</span>
              <span data-c="m-tab-archived" className={tab(archTab)}>Archived</span>
            </div>
            {(!archived || archTab) && (
              <div style={archTab ? appear(t, 4.6) : { opacity: archived ? 0 : 1 }}>
                <Card accent="blue" className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-[15px]">Tutor matching for parents</div>
                      <div className="text-[11px] text-[var(--text3)]">{day(40)}</div>
                    </div>
                    {archTab && <Badge variant="neutral">Archived</Badge>}
                  </div>
                  <div className="text-[11px] text-[var(--text3)]">Slug: <span className="font-mono text-[var(--accent2)]">/s/tutor-match-p2d7</span></div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
                    <Button size="sm" variant="primary"><BarChart2 size={13} /> View</Button>
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost" data-c="m-archive"><Archive size={13} /></Button>
                      <Button size="sm" variant="ghost"><Trash2 size={13} /></Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            {between(t, 3.3, 4.6) && <p className="text-center text-[13px] text-[var(--text2)] mt-10">Idea archived — your data is kept.</p>}
          </div>
        </div>
        <div style={appear(t, 0.4)}>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-3">Light or dark</p>
          <div className={cn(tile, 'transition-colors duration-500 text-[var(--text)]')} style={light ? LIGHT_VARS : undefined}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Stat label="Conversations" value={12} target={15} icon={<ClipboardList size={14} />} accent="blue" color="linear-gradient(90deg,var(--accent),var(--accent2))" />
              <Stat label="Feel the Pain" value={67} unit="%" icon={<TrendingUp size={14} />} accent="yellow" color="" />
            </div>
            <div data-c="m-theme" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] w-fit">
              {light ? <Moon size={15} /> : <Sun size={15} />} {light ? 'Dark mode' : 'Light mode'}
            </div>
          </div>
        </div>
        <Cursor t={t} keys={keys} />
      </div>
    );
  },
};

const outro: Scene = {
  id: 'outro', chapter: 'Wrap-up', duration: 8,
  captions: [
    { at: 0, text: 'Ask. Listen. Learn. Decide.' },
    { at: 3.6, text: 'Find out if your idea is actually wanted — before you build it.' },
  ],
  render: (t) => {
    const nodes = [
      { label: 'Ask', sub: 'Survey', icon: '📋', x: 0, y: -170 },
      { label: 'Listen', sub: 'Conversations', icon: '🎙️', x: 230, y: 0 },
      { label: 'Learn', sub: 'Results', icon: '🤖', x: 0, y: 170 },
      { label: 'Decide', sub: 'Hypotheses', icon: '💡', x: -230, y: 0 },
    ];
    const active = Math.floor((t - 0.4) / 0.7);
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,.12),transparent_55%),var(--bg)]">
        <div className="absolute left-1/2 top-[280px]">
          <svg className="absolute -left-[240px] -top-[180px]" width="480" height="360" viewBox="-240 -180 480 360">
            <ellipse cx="0" cy="0" rx="230" ry="170" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 8"
              style={{ strokeDashoffset: -t * 20 }} />
          </svg>
          {nodes.map((n, i) => {
            const lit = t > 3.2 || active % 4 === i;
            return (
              <div key={n.label} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: n.x, top: n.y, ...appear(t, 0.2 + i * 0.25) }}>
                <div className={cn('w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-[28px] border transition-all duration-300',
                  lit ? 'bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.5)] shadow-[0_0_30px_rgba(245,158,11,.35)]' : 'bg-[var(--surface)] border-[var(--border)]')}>{n.icon}</div>
                <div className="font-black text-[18px] mt-2">{n.label}</div>
                <div className="text-[11px] text-[var(--text3)]">{n.sub}</div>
              </div>
            );
          })}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={appear(t, 1.2)}>
            <div className="font-black text-[30px] tracking-wider uppercase">Validate</div>
            <div className="text-[11px] text-[var(--text3)] tracking-wider">Idea Validator</div>
          </div>
        </div>
        <div className="absolute left-0 right-0 top-[510px] text-center" style={appear(t, 3.6)}>
          <p className="text-[15px] text-[var(--text2)] italic mb-4">"Weeks, not months. Signal, not silence."</p>
          <span className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white text-[15px] font-bold shadow-[0_8px_24px_rgba(245,158,11,.35)]"
            style={{ transform: `scale(${1 + 0.03 * Math.sin(t * 4) * easeOut(clamp(t - 4))})` }}>
            Start validating free <ArrowRight size={16} />
          </span>
        </div>
      </div>
    );
  },
};

export const SCENES: Scene[] = [
  intro, signup, newIdea, onboarding,
  survey, settings, share,
  respondent, responses,
  hypothesis, conversation, sortScene,
  dashboard, analysis, decide, publicLink,
  montage, outro,
];
