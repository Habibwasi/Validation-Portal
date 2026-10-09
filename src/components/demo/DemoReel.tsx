import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, Captions, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCENES } from './scenes';
import { StageContext, STAGE_W, STAGE_H, clamp } from './motion';

// A scripted walkthrough of the real product flow, rendered live from the
// app's own components rather than a recorded or generated video.

const STARTS = SCENES.reduce<number[]>((acc, _s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].duration], []);
const TOTAL = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].duration;

const CHAPTERS = SCENES.reduce<{ name: string; start: number; end: number }[]>((acc, s, i) => {
  const last = acc[acc.length - 1];
  const end = STARTS[i] + s.duration;
  if (last && last.name === s.chapter) last.end = end;
  else acc.push({ name: s.chapter, start: STARTS[i], end });
  return acc;
}, []);

const FADE = 0.3;

function locate(time: number) {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (STARTS[k] <= time) i = k;
  return { scene: SCENES[i], index: i, local: time - STARTS[i] };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function DemoReel() {
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [scale, setScale] = useState(0.5);
  const timeRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  // Fit the fixed 1280×720 stage into whatever width the player gets.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / STAGE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { rootRef.current?.focus(); }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Cap the step so a backgrounded tab doesn't jump ahead on return.
      timeRef.current = Math.min(TOTAL, timeRef.current + Math.min(0.1, (now - last) / 1000));
      last = now;
      setTime(timeRef.current);
      if (timeRef.current >= TOTAL) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = (v: number) => {
    timeRef.current = clamp(v, 0, TOTAL);
    setTime(timeRef.current);
  };

  const toggle = () => {
    if (timeRef.current >= TOTAL) { seek(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(timeRef.current + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(timeRef.current - 5); }
    else if (e.key === 'c') setCaptionsOn((c) => !c);
  };

  const scrubTo = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * TOTAL);
  };

  const { scene, index, local } = locate(time);
  const fadeIn = index === 0 ? 1 : clamp(local / FADE);
  const fadeOut = index === SCENES.length - 1 ? 1 : clamp((scene.duration - local) / FADE);
  const caption = [...scene.captions].reverse().find((c) => c.at <= local)?.text;
  const chapter = CHAPTERS.find((c) => time >= c.start && time < c.end) ?? CHAPTERS[CHAPTERS.length - 1];
  const ended = time >= TOTAL;
  const notStarted = time === 0 && !playing;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKey}
      role="region"
      aria-label="Validate Portal product walkthrough. Space to play or pause, arrow keys to skip, C for captions."
      className="w-full outline-none bg-[var(--bg)]"
    >
      <style>{`@keyframes demo-blink{0%,49%{opacity:1}50%,100%{opacity:0}}.demo-caret{animation:demo-blink 1s step-end infinite}`}</style>

      {/* Video area */}
      <div ref={boxRef} className="relative w-full aspect-video overflow-hidden bg-[var(--bg)] cursor-pointer" onClick={toggle}>
        <StageContext.Provider value={{ stage: stageRef, scale }}>
          <div
            ref={stageRef}
            aria-hidden
            className="absolute left-0 top-0 overflow-hidden pointer-events-none select-none bg-[var(--bg)] text-[var(--text)]"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <div key={scene.id} className="absolute inset-0" style={{ opacity: Math.min(fadeIn, fadeOut) }}>
              {scene.render(local)}
            </div>
          </div>
        </StageContext.Provider>

        {captionsOn && caption && !ended && (
          <div className="absolute inset-x-0 bottom-[3%] flex justify-center px-3 pointer-events-none">
            <p className="max-w-[92%] sm:max-w-[64%] text-center bg-black/75 text-white text-[11px] sm:text-[15px] leading-snug rounded-md px-3 py-1.5">
              {caption}
            </p>
          </div>
        )}

        {notStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,.5)]">
              <Play size={22} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm text-center px-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-black text-[18px] sm:text-[26px]">Ready to test your own idea?</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white text-[14px] font-bold hover:brightness-110 transition-all shadow-[0_8px_24px_rgba(245,158,11,.35)]"
              >
                Start validating free <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => { seek(0); setPlaying(true); }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] border border-white/30 text-white text-[14px] font-semibold hover:bg-white/10 transition-all"
              >
                <RotateCcw size={14} /> Watch again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface)] border-t border-[var(--border)]">
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white"
        >
          {playing ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
        </button>

        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(TOTAL)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} — ${chapter.name}`}
          className="relative flex-1 h-6 flex items-center gap-[3px] cursor-pointer touch-none"
          onPointerDown={(e) => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); scrubTo(e); }}
          onPointerMove={(e) => { if (scrubbing.current) scrubTo(e); }}
          onPointerUp={() => { scrubbing.current = false; }}
        >
          {CHAPTERS.map((c) => {
            const fill = clamp((time - c.start) / (c.end - c.start));
            return (
              <div key={c.name} className="relative h-1.5 rounded-full bg-[var(--border)] overflow-hidden" style={{ flexGrow: c.end - c.start }} title={c.name}>
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" style={{ width: `${fill * 100}%` }} />
              </div>
            );
          })}
        </div>

        <span className="hidden sm:inline text-[12px] text-[var(--text2)] font-medium w-[96px] truncate">{chapter.name}</span>
        <span className="text-[11px] text-[var(--text3)] tabular-nums flex-shrink-0">{fmt(time)} / {fmt(TOTAL)}</span>
        <button
          onClick={() => setCaptionsOn((c) => !c)}
          aria-label={captionsOn ? 'Hide captions' : 'Show captions'}
          aria-pressed={captionsOn}
          className={cn('p-1.5 rounded-md flex-shrink-0 transition-colors', captionsOn ? 'text-[var(--accent)]' : 'text-[var(--text3)] hover:text-[var(--text)]')}
        >
          <Captions size={16} />
        </button>
      </div>
    </div>
  );
}
