import { useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  LayoutDashboard, MessageSquare, ClipboardList, BarChart2, Settings,
  ChevronLeft, ChevronDown, LogOut, FolderOpen, Sun, UserCircle, X, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageContext, STAGE_W, STAGE_H, clamp, easeInOut, fade, lerp, type CursorKey } from './motion';

// ── Cursor ───────────────────────────────────────────────────────────────────

export function Cursor({ t, keys }: { t: number; keys: CursorKey[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cache = useRef<Record<number, [number, number]>>({});
  const { stage, scale } = useContext(StageContext);

  useLayoutEffect(() => {
    const el = ref.current;
    const ring = ringRef.current;
    const root = stage.current;
    if (!el || !ring || !root || keys.length === 0) return;
    // Measure relative to the element the cursor is positioned in (e.g. below the browser chrome).
    const rootRect = (el.offsetParent ?? root).getBoundingClientRect();

    const pos = (i: number): [number, number] | null => {
      const k = keys[i];
      if (Array.isArray(k.to)) return k.to;
      const target = root.querySelector(`[data-c="${k.to}"]`);
      if (target) {
        const r = target.getBoundingClientRect();
        const p: [number, number] = [
          (r.left - rootRect.left + r.width / 2) / scale,
          (r.top - rootRect.top + r.height / 2) / scale,
        ];
        cache.current[i] = p;
        return p;
      }
      return cache.current[i] ?? null;
    };

    let idx = 0;
    for (let i = 0; i < keys.length; i++) if (keys[i].at <= t) idx = i;
    const cur = pos(idx);
    let x = cur?.[0] ?? STAGE_W / 2;
    let y = cur?.[1] ?? STAGE_H / 2;

    const next = keys[idx + 1];
    if (next && t >= keys[0].at) {
      const moveDur = Math.min(0.7, next.at - keys[idx].at);
      const moveStart = next.at - moveDur;
      if (t > moveStart) {
        const to = pos(idx + 1);
        if (to) {
          const p = easeInOut(clamp((t - moveStart) / moveDur));
          x = lerp(x, to[0], p);
          y = lerp(y, to[1], p);
        }
      }
    }

    const clickKey = keys.find((k) => k.click && t >= k.at && t < k.at + 0.45);
    const cp = clickKey ? (t - clickKey.at) / 0.45 : 1;
    const pressed = clickKey && cp < 0.35;

    el.style.transform = `translate(${x}px, ${y}px) scale(${pressed ? 0.85 : 1})`;
    el.style.opacity = String(clamp((t - keys[0].at + 0.3) / 0.3));
    ring.style.opacity = clickKey ? String(1 - cp) : '0';
    ring.style.transform = `translate(-50%, -50%) scale(${0.4 + cp * 1.2})`;
  });

  return (
    <div ref={ref} className="absolute left-0 top-0 z-[60] pointer-events-none" style={{ opacity: 0 }}>
      <div
        ref={ringRef}
        className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-[var(--accent)] bg-[rgba(245,158,11,.18)]"
        style={{ opacity: 0 }}
      />
      <svg width="24" height="24" viewBox="0 0 24 24" className="absolute -left-[4px] -top-[2px] drop-shadow-[0_2px_4px_rgba(0,0,0,.5)]">
        <path d="M4 2 L20 11.5 L13 13.1 L9.4 20 Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Toast (matches the app's react-hot-toast config: bottom-right, surface) ─

export function Toast({ t, from, to, children, icon = 'success' }: {
  t: number; from: number; to: number; children: ReactNode; icon?: 'success' | 'warn';
}) {
  const o = fade(t, from, to, 0.3);
  if (o <= 0) return null;
  return (
    <div
      className="absolute right-5 bottom-5 z-50 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-[13px] shadow-[0_3px_10px_rgba(0,0,0,.25)] max-w-[350px]"
      style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)` }}
    >
      {icon === 'success' ? (
        <span className="w-5 h-5 rounded-full bg-[var(--green)] flex items-center justify-center flex-shrink-0">
          <Check size={12} strokeWidth={3} className="text-[var(--bg)]" />
        </span>
      ) : (
        <span className="flex-shrink-0">⚠️</span>
      )}
      <span>{children}</span>
    </div>
  );
}

// ── Form field replicas (same look as the global input styles) ──────────────

export function Caret() {
  return <span className="demo-caret inline-block w-px h-[14px] bg-[var(--text)] align-middle ml-px" />;
}

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <div className="text-[13px] font-medium text-[var(--text)] flex items-center">
      {children}
      {required && <span className="text-[var(--red)] ml-1">*</span>}
    </div>
  );
}

export function Field({ label, required, value, placeholder, focused, rows, hint, mono, c, className }: {
  label?: string; required?: boolean; value: string; placeholder?: string; focused?: boolean;
  rows?: number; hint?: string; mono?: boolean; c?: string; className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label required={required}>{label}</Label>}
      <div
        data-c={c}
        className={cn(
          'bg-[var(--surface2)] border rounded-lg px-3 py-[9px] text-[13px] leading-[1.5] transition-[border-color,box-shadow] duration-200',
          focused ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(245,158,11,.15)]' : 'border-[var(--border)]',
          mono && 'font-mono',
        )}
        style={rows ? { minHeight: 18 + rows * 19.5 } : undefined}
      >
        {value ? <span className="text-[var(--text)] whitespace-pre-wrap break-words">{value}</span>
          : !focused && <span className="text-[var(--text3)]">{placeholder}</span>}
        {focused && <Caret />}
      </div>
      {hint && <p className="text-[11px] text-[var(--text3)]">{hint}</p>}
    </div>
  );
}

export function Checkbox({ checked, c, accent = 'var(--accent)' }: { checked: boolean; c?: string; accent?: string }) {
  return (
    <span
      data-c={c}
      className="w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center flex-shrink-0"
      style={checked ? { background: accent, borderColor: accent } : { borderColor: 'var(--text3)' }}
    >
      {checked && <Check size={10} strokeWidth={3.5} className="text-white" />}
    </span>
  );
}

// ── Browser chrome ───────────────────────────────────────────────────────────

export function Browser({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--bg)]">
      <div className="h-10 flex-shrink-0 bg-[var(--surface2)] border-b border-[var(--border)] px-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 max-w-xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-1 text-[11px] text-[var(--text3)] text-center truncate">
          {url}
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="relative flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// ── App shell replica (sidebar + main) ───────────────────────────────────────

type NavKey = 'dashboard' | 'survey' | 'interviews' | 'analysis' | 'settings' | 'ideas';

const NAV: { key: NavKey; label: string; icon: ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { key: 'survey', label: 'Survey Builder', icon: <MessageSquare size={15} /> },
  { key: 'interviews', label: 'Conversations', icon: <ClipboardList size={15} /> },
  { key: 'analysis', label: 'My Results', icon: <BarChart2 size={15} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
];

function NavRow({ active, icon, label, c }: { active: boolean; icon: ReactNode; label: string; c?: string }) {
  return (
    <div
      data-c={c}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium border',
        active
          ? 'bg-gradient-to-r from-[rgba(245,158,11,.15)] to-[rgba(251,146,60,.08)] text-[var(--text)] border-[rgba(245,158,11,.25)]'
          : 'text-[var(--text2)] border-transparent',
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </div>
  );
}

export function Sidebar({ active, project }: { active: NavKey; project?: string }) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg2)] h-full">
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <div className="font-black text-[15px] tracking-wider text-[var(--text)] uppercase">Validate</div>
        <div className="text-[10px] text-[var(--text3)] tracking-wider mt-0.5">Idea Validator</div>
      </div>
      {project && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text3)] mb-3">
            <ChevronLeft size={12} /> All ideas
          </div>
          <div data-c="project-switch" className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Project</div>
            <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--text)]">
              {project} <ChevronDown size={11} className="text-[var(--text3)]" />
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
        {project
          ? NAV.map((n) => <NavRow key={n.key} c={`nav-${n.key}`} active={active === n.key} icon={n.icon} label={n.label} />)
          : <NavRow active icon={<FolderOpen size={15} />} label="My Ideas" />}
      </nav>
      <div className="px-3 pb-4 border-t border-[var(--border)] pt-3 space-y-1">
        {!project && <NavRow active={false} icon={<UserCircle size={15} />} label="Profile" />}
        <NavRow active={false} c="theme-toggle" icon={<Sun size={15} />} label="Light mode" />
        <NavRow active={false} icon={<LogOut size={15} />} label="Sign out" />
      </div>
    </aside>
  );
}

export function Shell({ active, project, scroll = 0, children }: {
  active: NavKey; project?: string; scroll?: number; children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex">
      <Sidebar active={active} project={project} />
      <main className="relative flex-1 overflow-hidden">
        <div style={{ transform: `translateY(${-scroll}px)` }}>{children}</div>
      </main>
    </div>
  );
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="font-black text-[24px] tracking-tight text-[var(--text)] leading-tight">{title}</h1>
        {subtitle && <p className="text-[var(--text2)] text-[13px] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ── Modal replica (the real Modal is fixed to the viewport) ─────────────────

export function ModalBox({ o, title, size = 'md', children, footer, bodyScroll = 0, bodyHeight }: {
  o: number; title: string; size?: 'sm' | 'md' | 'lg'; children: ReactNode; footer?: ReactNode;
  bodyScroll?: number; bodyHeight?: number;
}) {
  if (o <= 0) return null;
  const width = { sm: 384, md: 512, lg: 672 }[size];
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      style={{ opacity: o }}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full shadow-[0_24px_60px_rgba(0,0,0,.5)] flex flex-col"
        style={{ maxWidth: width, transform: `scale(${0.96 + 0.04 * o})` }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[16px]">{title}</h2>
          <X size={16} className="text-[var(--text3)]" />
        </div>
        <div className="px-6 py-4 overflow-hidden" style={bodyHeight ? { height: bodyHeight } : undefined}>
          <div style={{ transform: `translateY(${-bodyScroll}px)` }}>{children}</div>
        </div>
        {footer && <div className="px-6 py-4 border-t border-[var(--border)] flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
