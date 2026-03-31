import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ClipboardList, BarChart2, ArrowRight, CheckCircle, Play, X } from 'lucide-react';

// ── Demo video modal ──────────────────────────────────────────────────────────

const DEMO_VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL as string | undefined;

function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X size={14} />
        </button>
        {DEMO_VIDEO_URL ? (
          <iframe
            src={DEMO_VIDEO_URL}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-[#0e0c0a] flex items-center justify-center">
            <p className="text-[var(--text3)] text-sm">Add your demo URL via <code className="text-[var(--accent)]">VITE_DEMO_VIDEO_URL</code> env variable.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product preview mock ──────────────────────────────────────────────────────

function ProductPreview({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-14">
      {/* Glow */}
      <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[rgba(245,158,11,.15)] via-[rgba(251,146,60,.08)] to-transparent -z-10 rounded-3xl" />

      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_32px_80px_rgba(0,0,0,.6)]">
        {/* Title bar */}
        <div className="bg-[var(--surface2)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-1 text-[11px] text-[var(--text3)] text-center">
            validate-portal.vercel.app
          </div>
        </div>

        {/* App content mock */}
        <div className="bg-[var(--bg)] grid grid-cols-[200px_1fr] min-h-[340px]">
          {/* Sidebar mock */}
          <div className="bg-[var(--surface)] border-r border-[var(--border)] p-4 space-y-1">
            <div className="text-[10px] font-black tracking-widest text-[var(--accent)] mb-4 px-2">VALIDATE</div>
            {['Dashboard', 'Interviews', 'Survey', 'Analysis'].map((item, i) => (
              <div
                key={item}
                className={`px-3 py-2 rounded-lg text-[12px] font-medium ${i === 3 ? 'bg-[rgba(245,158,11,.15)] text-[var(--accent)]' : 'text-[var(--text3)]'}`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main area mock */}
          <div className="p-6 space-y-4">
            {/* Verdict card */}
            <div className="border border-[rgba(34,197,94,.3)] border-l-[3px] border-l-[#22c55e] rounded-xl p-4 bg-[rgba(34,197,94,.05)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(34,197,94,.15)] text-[#22c55e] border border-[rgba(34,197,94,.3)]">
                  ✅ Strong Signal
                </div>
                <span className="text-[11px] text-[var(--text3)]">12 interviews · 47 survey responses</span>
              </div>
              <p className="text-[12px] text-[var(--text2)] leading-relaxed">
                Clear demand signal. 8 of 12 interviewees rated the problem 8/10 or higher — this is a real, painful problem worth building for.
              </p>
            </div>

            {/* Themes row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Wasted months building', strength: 'high', color: '#dc2626' },
                { title: 'No feedback before launch', strength: 'high', color: '#dc2626' },
              ].map(({ title, strength, color }) => (
                <div key={title} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[12px] font-semibold text-[var(--text)]">{title}</span>
                    <span className="text-[10px] px-1.5 rounded font-bold" style={{ background: `${color}22`, color }}>{strength}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Play button overlay */}
      <button
        onClick={onPlay}
        className="absolute inset-0 flex items-center justify-center group"
        aria-label="Watch demo"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,.5)] group-hover:scale-110 group-hover:shadow-[0_0_60px_rgba(245,158,11,.7)] transition-all duration-300">
          <Play size={22} className="text-white ml-1" fill="white" />
        </div>
      </button>

      <p className="text-center text-[12px] text-[var(--text3)] mt-4">Watch the 30-second walkthrough</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

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
      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}

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
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-8 text-center">
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
          <button
            onClick={() => setVideoOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] border border-[var(--border)] text-[var(--text2)] text-[15px] font-semibold hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
          >
            <Play size={15} className="text-[var(--accent)]" fill="currentColor" /> Watch demo
          </button>
        </div>

        {/* Product preview */}
        <ProductPreview onPlay={() => setVideoOpen(true)} />
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-center text-[13px] font-bold uppercase tracking-widest text-[var(--text3)] mb-12">
          The difference it makes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_8px_40px_rgba(0,0,0,.3)]">
          {/* Without */}
          <div className="bg-[rgba(239,68,68,.04)] border-r border-[var(--border)] p-8 md:p-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-[rgba(239,68,68,.15)] flex items-center justify-center text-[14px]">✗</div>
              <span className="font-black text-[16px] text-[#ef4444]">Without Validate</span>
            </div>
            <p className="text-[28px] md:text-[32px] font-black leading-tight text-[var(--text)] mb-6">
              6 months building<br />the wrong thing.
            </p>
            <ul className="space-y-3">
              {[
                'Assume people have the problem',
                'Build in isolation for months',
                'Guess what features matter',
                'Launch to silence or polite feedback',
                'Pivot or shut down after sunk costs',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--text2)]">
                  <span className="text-[#ef4444] mt-0.5 flex-shrink-0">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="bg-[rgba(34,197,94,.04)] p-8 md:p-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-[rgba(34,197,94,.15)] flex items-center justify-center text-[14px]">✓</div>
              <span className="font-black text-[16px] text-[#22c55e]">With Validate</span>
            </div>
            <p className="text-[28px] md:text-[32px] font-black leading-tight text-[var(--text)] mb-6">
              2 weeks knowing<br />it's wanted.
            </p>
            <ul className="space-y-3">
              {[
                'Confirm real pain in real conversations',
                'Survey hundreds in their own language',
                'AI tells you exactly what themes emerged',
                'Know your strong signals before writing code',
                'Build with confidence — or move on fast',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--text2)]">
                  <span className="text-[#22c55e] mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-[13px] text-[var(--text3)] mt-5 italic">
          "Weeks, not months. Signal, not silence."
        </p>
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
