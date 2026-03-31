import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ClipboardList, BarChart2, ArrowRight, CheckCircle } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/app', { replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] max-w-5xl mx-auto">
        <div>
          <div className="font-black text-[16px] tracking-wider uppercase">Validate</div>
          <div className="text-[10px] text-[var(--text3)] tracking-wider">Idea Validator</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[13px] text-[var(--text2)] hover:text-[var(--text)] transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white text-[13px] font-semibold hover:brightness-110 transition-all shadow-[0_4px_14px_rgba(245,158,11,.3)]"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[rgba(245,158,11,.1)] border border-[rgba(245,158,11,.2)] rounded-full px-4 py-1.5 text-[12px] text-[var(--accent)] font-medium mb-6">
          ✨ Free to use — no credit card needed
        </div>
        <h1 className="text-[48px] md:text-[60px] font-black leading-[1.1] mb-6">
          Find out if your idea<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]">
            is actually wanted
          </span>
        </h1>
        <p className="text-[18px] text-[var(--text2)] max-w-xl mx-auto mb-10 leading-relaxed">
          Talk to real people, collect survey responses, and get an AI verdict on whether your startup idea has legs — before you spend months building it.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white text-[15px] font-bold hover:brightness-110 hover:-translate-y-px transition-all shadow-[0_8px_24px_rgba(245,158,11,.35)]"
          >
            Start validating free <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] border border-[var(--border)] text-[var(--text2)] text-[15px] font-semibold hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-[13px] font-bold uppercase tracking-widest text-[var(--text3)] mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: <ClipboardList size={22} />,
              title: 'Talk to people',
              desc: 'Log conversations with potential users. Rate their pain, capture their exact words, and spot who would actually pay.',
            },
            {
              step: '02',
              icon: <MessageSquare size={22} />,
              title: 'Send your survey',
              desc: 'Build a survey in minutes and share a link. Respondents answer in their own language — no login required.',
            },
            {
              step: '03',
              icon: <BarChart2 size={22} />,
              title: 'Get your verdict',
              desc: 'AI reads your data and tells you: Strong Signal, Partial Signal, or Too Early — with the evidence to back it up.',
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 relative">
              <div className="text-[11px] font-black text-[var(--accent)] tracking-widest mb-4">{step}</div>
              <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,.1)] text-[var(--accent)] flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="font-bold text-[15px] mb-2">{title}</h3>
              <p className="text-[13px] text-[var(--text2)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-center text-[13px] font-bold uppercase tracking-widest text-[var(--text3)] mb-10">
          Everything you need to validate
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { emoji: '🎙️', title: 'Interview tracker', desc: 'Log every conversation with pain scores, quotes, and tags. Know who would actually use your product.' },
            { emoji: '📋', title: 'Survey builder', desc: 'Drag-to-reorder questions, 7 question types, and a shareable public link — no login needed for respondents.' },
            { emoji: '🌍', title: 'Multi-language surveys', desc: 'Reach people in English, Arabic, French, Spanish, Hindi, and 5 more languages — translated by AI in one click.' },
            { emoji: '🤖', title: 'AI signal analysis', desc: 'Get a plain-English verdict with themes, key quotes, and specific next steps — not just charts.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="text-2xl flex-shrink-0">{emoji}</div>
              <div>
                <h3 className="font-bold text-[14px] mb-1">{title}</h3>
                <p className="text-[13px] text-[var(--text2)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / verdicts */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <p className="text-[13px] text-[var(--text3)] uppercase tracking-widest font-bold mb-6">The AI gives you one of four verdicts</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: '✅ Strong Signal', color: 'rgba(34,197,94,.15)', border: 'rgba(34,197,94,.3)', text: '#22c55e' },
              { label: '⚡ Partial Signal', color: 'rgba(234,179,8,.12)', border: 'rgba(234,179,8,.3)', text: '#eab308' },
              { label: '⏳ Too Early', color: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#f59e0b' },
              { label: '❌ No Signal', color: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#ef4444' },
            ].map(({ label, color, border, text }) => (
              <div
                key={label}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold"
                style={{ background: color, border: `1px solid ${border}`, color: text }}
              >
                {label}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[var(--text2)] mt-6 max-w-md mx-auto">
            Each verdict comes with themes, supporting quotes from real people, and a numbered list of what to do next.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-[36px] font-black mb-4">
          Stop guessing.<br />Start knowing.
        </h2>
        <p className="text-[16px] text-[var(--text2)] mb-8 max-w-md mx-auto">
          It takes 5 minutes to set up your first idea. The conversations you log this week could save you months of building the wrong thing.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-[10px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white text-[15px] font-bold hover:brightness-110 hover:-translate-y-px transition-all shadow-[0_8px_24px_rgba(245,158,11,.35)]"
        >
          Start for free <ArrowRight size={16} />
        </Link>
        <div className="flex items-center justify-center gap-6 mt-6 text-[12px] text-[var(--text3)]">
          {['No credit card', 'Free forever plan', 'Set up in 5 minutes'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-[var(--green)]" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-[12px] text-[var(--text3)]">
        Built for first-time founders who want to get it right the first time.
      </footer>
    </div>
  );
}
