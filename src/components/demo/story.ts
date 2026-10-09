import type { QuestionType } from '@/types';
import { formatDate } from '@/lib/utils';

// ── Story data: one founder validating one idea ──────────────────────────────

export const HOST = 'validation-portal.vercel.app';
export const PROJECT = 'ShiftSwap';
export const DESC = 'Hourly workers struggle to swap shifts — managers juggle group chats and missed messages.';
export const SLUG = 'shiftswap-k3x9';
export const SURVEY_URL = `https://${HOST}/s/${SLUG}`;
export const PID = '7c1e…';
export const WELCOME = 'Takes about 2 minutes. Anonymous — no personal data collected.';
export const THANKYOU = 'Thanks — this helps us build something that actually fixes shift swaps.';

export const NOW = Date.now();
export const day = (daysAgo: number) => formatDate(new Date(NOW - daysAgo * 864e5).toISOString());

export interface Q { id: string; type: QuestionType; label: string; options?: string[] }

export const Q_STORY: Q = { id: 'q1', type: 'long_text', label: 'Think about the last time you needed to swap a shift. How did you arrange it?' };
export const Q_PAIN: Q = { id: 'q2', type: 'rating', label: 'How painful is finding someone to cover your shift?' };
export const Q_FREQ: Q = { id: 'q3', type: 'choice', label: 'How often do you need to swap or give away a shift?', options: ['Weekly', 'Monthly', 'A few times a year', 'Never'] };
export const Q_MISSED: Q = { id: 'q4', type: 'yes_no', label: 'Have you ever missed a shift because a swap fell through?' };
export const BIASED_LABEL = 'Would you use an app that made swapping shifts easier?';
export const FIXED_LABEL = 'Have you tried any app or tool to swap shifts in the past year?';
export const Q_TRIED: Q = { id: 'q5', type: 'yes_no', label: FIXED_LABEL };
export const FINAL_QS = [Q_PAIN, Q_STORY, Q_FREQ, Q_MISSED, Q_TRIED];

export const TYPE_META: Record<QuestionType, { label: string; description: string; color: 'blue' | 'red' | 'yellow' | 'green' | 'purple' }> = {
  text:         { label: 'Short text',       description: 'One-line answer',       color: 'blue' },
  long_text:    { label: 'Long text',        description: 'Multi-line answer',     color: 'blue' },
  rating:       { label: 'Pain rating 1–10', description: 'Measures pain severity', color: 'red' },
  scale:        { label: 'Scale 1–10',       description: 'General numeric scale', color: 'yellow' },
  yes_no:       { label: 'Yes / No',         description: 'Binary question',       color: 'green' },
  choice:       { label: 'Single choice',    description: 'Pick one option',       color: 'purple' },
  multi_choice: { label: 'Multi choice',     description: 'Pick multiple options', color: 'purple' },
};

export const H1 = { customer: 'hourly retail and café workers', problem: 'no fast way to swap shifts', price: '$4/month', solution: 'a shift-swap app with manager approval' };
export const H2 = { customer: 'shift managers', problem: 'hours lost approving swaps by text', price: '', solution: 'one-tap swap approvals' };

export const MAYA_QUOTE = 'I spend my whole break texting people to cover me.';
export const MAYA_TAGS = 'group-chat, missed-shift, pilot';
export const MAYA_NOTES = 'Works 3 part-time jobs. Wants to try a beta.';

export interface IV { id: string; name: string; date: string; tags: string[]; avg: number; pilot?: boolean; h?: string[] }
export const MAYA: IV = { id: 'maya', name: 'Maya R.', date: day(0), tags: ['group-chat', 'missed-shift', 'pilot'], avg: 9, pilot: true, h: ['H1'] };
export const JORDAN: IV = { id: 'jordan', name: 'Jordan K.', date: day(1), tags: ['group-chat', 'manager'], avg: 6 };
export const PRIYA: IV = { id: 'priya', name: 'Priya S.', date: day(3), tags: ['missed-shift', 'cost'], avg: 8, pilot: true };
export const LEO: IV = { id: 'leo', name: 'Leo M.', date: day(4), tags: ['rarely-swaps'], avg: 4 };

export const ANALYSIS = {
  summary: '8 of 12 people rated the pain 7/10 or higher, and most already rely on group chats as a workaround. Demand looks real — but evidence on willingness to pay is still thin.',
  themes: [
    { title: 'Group chats are the default workaround', description: 'Nearly everyone posts in a team chat and waits — swaps often take hours to confirm.', strength: 'high' as const },
    { title: 'Missed shifts carry a real cost', description: 'Several people lost pay or got written up when a swap fell through.', strength: 'high' as const },
    { title: 'Managers are a second audience', description: 'Approvals by text came up in conversations with both workers and managers.', strength: 'medium' as const },
  ],
  quotes: [MAYA_QUOTE, "Last month I lost a whole shift's pay because nobody saw my message.", 'Half my week is approving swaps over text.'],
  next: ['Run pilot conversations with your 5 pilot-ready leads', 'Test a $4/month price point directly', 'Interview 3 more shift managers about approvals'],
  warnings: ['Only 5 people discussed price — the pricing assumption is weakly tested.', 'Most survey responses arrived within 2 days — check they are not all from one workplace.'],
};

// ── Display metadata ─────────────────────────────────────────────────────────

export const STATUS_META = {
  untested:  { label: 'Untested',  variant: 'neutral' as const, dot: 'bg-[var(--text3)]' },
  supported: { label: 'Supported', variant: 'green' as const,   dot: 'bg-[var(--green)]' },
  disproved: { label: 'Disproved', variant: 'red' as const,     dot: 'bg-[var(--red)]' },
  pivoted:   { label: 'Pivoted',   variant: 'yellow' as const,  dot: 'bg-[var(--yellow)]' },
};
export type Status = keyof typeof STATUS_META;

export const STRENGTH = { high: { variant: 'green' as const, label: 'High' }, medium: { variant: 'yellow' as const, label: 'Medium' }, low: { variant: 'red' as const, label: 'Low' } };

export const H2_TITLE = 'font-bold text-[13px] uppercase tracking-wider text-[var(--text3)] mb-3';
