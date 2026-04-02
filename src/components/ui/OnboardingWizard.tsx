import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectSlug: string;
  projectName: string;
  hasQuestions: boolean;
}

const STEPS = [
  { label: 'Name your idea' },
  { label: 'Add a question' },
  { label: 'Share your survey' },
];

export function OnboardingWizard({
  open,
  onClose,
  projectId,
  projectSlug,
  projectName,
  hasQuestions,
}: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const surveyUrl = `${window.location.origin}/s/${projectSlug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(surveyUrl).then(() => toast.success('Link copied!'));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,.5)] overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-[var(--bg2)]">
          <div
            className="h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-5 px-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                  i < step
                    ? 'bg-[var(--accent)] text-white'
                    : i === step
                    ? 'bg-[var(--accent)] text-white ring-4 ring-[rgba(59,130,246,.2)]'
                    : 'bg-[var(--bg2)] text-[var(--text3)]',
                )}
              >
                {i < step ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[12px] hidden sm:inline',
                  i === step ? 'text-[var(--text)] font-medium' : 'text-[var(--text3)]',
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-6 h-px mx-1', i < step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pt-6 pb-4">
          {step === 0 && (
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-[18px] font-bold text-[var(--text)] mb-2">
                Your idea is live!
              </h2>
              <p className="text-[13px] text-[var(--text2)] mb-1">
                You just created <span className="font-semibold text-[var(--text)]">"{projectName}"</span>.
              </p>
              <p className="text-[13px] text-[var(--text2)] mb-6">
                Now let's set up your survey so you can start collecting real signals from real people.
              </p>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 text-left mb-6">
                <p className="text-[12px] text-[var(--text3)] font-medium uppercase tracking-wide mb-2">Your next steps</p>
                {[
                  { icon: '📋', text: 'Add at least one question to your survey' },
                  { icon: '🔗', text: 'Copy the survey link and share it' },
                  { icon: '🎙️', text: 'Log your first customer conversation' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className="text-[14px]">{item.icon}</span>
                    <span className="text-[13px] text-[var(--text2)]">{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setStep(1)}
              >
                Got it, let's go <ArrowRight size={14} />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <h2 className="text-[18px] font-bold text-[var(--text)] mb-2">
                Build your survey
              </h2>
              <p className="text-[13px] text-[var(--text2)] mb-6">
                Add questions to measure pain, enthusiasm, and willingness to pay. One question is enough to start.
              </p>
              <div className="bg-[rgba(59,130,246,.06)] border border-[rgba(59,130,246,.2)] rounded-xl p-4 text-left mb-6">
                <p className="text-[12px] font-medium text-[var(--accent)] mb-2">💡 Good first questions</p>
                <ul className="space-y-1">
                  {[
                    '"How painful is this problem for you?" (1–10 scale)',
                    '"Would you pay for a solution?" (Yes/No)',
                    '"How would you describe the problem in your own words?" (Open text)',
                  ].map((q, i) => (
                    <li key={i} className="text-[12px] text-[var(--text2)]">• {q}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Skip for now
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    navigate(`/p/${projectId}/survey`);
                  }}
                >
                  Open Survey Builder <ExternalLink size={13} />
                </Button>
              </div>
              {hasQuestions && (
                <button
                  className="mt-3 text-[12px] text-[var(--accent)] hover:underline"
                  onClick={() => setStep(2)}
                >
                  I already have questions — next step →
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="text-4xl mb-3">🔗</div>
              <h2 className="text-[18px] font-bold text-[var(--text)] mb-2">
                Share your survey
              </h2>
              <p className="text-[13px] text-[var(--text2)] mb-4">
                Send this link to at least 5 people today. More responses = more accurate signals.
              </p>
              <div className="flex items-center gap-2 bg-[var(--bg2)] border border-[var(--border)] rounded-xl px-3 py-2.5 mb-3">
                <span className="flex-1 text-[12px] text-[var(--text2)] truncate text-left font-mono">
                  {surveyUrl}
                </span>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 text-[12px] text-[var(--accent)] hover:text-[var(--text)] font-medium shrink-0 transition-colors"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p className="text-[11px] text-[var(--text3)] mb-5">
                Share on LinkedIn, Slack, email — anywhere your target audience hangs out.
              </p>
              <Button variant="primary" className="w-full" onClick={onClose}>
                Done — take me to my dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <button
            className="text-[11px] text-[var(--text3)] hover:text-[var(--text2)] transition-colors"
            onClick={onClose}
          >
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
