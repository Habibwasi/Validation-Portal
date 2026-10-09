import { createContext, type CSSProperties, type RefObject } from 'react';

// ── Timing helpers ───────────────────────────────────────────────────────────
// Every scene is a pure function of its local time `t` (seconds), so the reel
// can be paused and scrubbed to any frame.

export const STAGE_W = 1280;
export const STAGE_H = 720;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

/** 0→1 progress of `t` through the window [start, start + dur], eased. */
export const prog = (t: number, start: number, dur: number) => easeInOut(clamp((t - start) / dur));

/** Visible between a and b, with a short fade at each end. */
export const fade = (t: number, a: number, b: number, f = 0.25) => clamp((t - a) / f) * clamp((b - t) / f);

/** The part of `text` typed so far, at `cps` characters per second. */
export const typed = (text: string, t: number, start: number, cps = 26) =>
  text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

export const between = (t: number, a: number, b: number) => t >= a && t < b;

/** Fade-and-rise entrance used for staggered content. */
export const appear = (t: number, at: number, dist = 10): CSSProperties => {
  const p = easeOut(clamp((t - at) / 0.4));
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

// ── Stage context (lets the cursor measure targets in stage coordinates) ────

export interface CursorKey {
  at: number;
  /** A `data-c` id to aim for, or absolute stage coordinates. */
  to: string | [number, number];
  click?: boolean;
}

export const StageContext = createContext<{ stage: RefObject<HTMLDivElement | null>; scale: number }>({
  stage: { current: null },
  scale: 1,
});

/** Colour tokens for the light theme, scoped to one element. */
export const LIGHT_VARS = {
  '--bg': '#faf8f5', '--bg2': '#f3f0eb', '--surface': '#ffffff', '--surface2': '#f5f2ed', '--border': '#e5dfd6',
  '--accent': '#d97706', '--accent2': '#ea580c', '--accent3': '#f59e0b',
  '--green': '#16a34a', '--yellow': '#ca8a04', '--red': '#dc2626', '--orange': '#ea580c',
  '--text': '#1a1410', '--text2': '#6b5e52', '--text3': '#a8998d',
} as CSSProperties;
