# Validate Portal

A general-purpose startup validation research tool. Create projects, build public surveys, log customer interviews, and get AI-powered signal analysis — all in one dark/light-themed SPA.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 5.9 |
| Styling | Tailwind CSS v4 (CSS-variables dark theme) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Guest access | Supabase anonymous sign-in + pg_cron cleanup |
| Bot protection | Cloudflare Turnstile (verified by Supabase Auth) |
| State | Zustand |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core + sortable |
| AI Analysis | Groq openai/gpt-oss-20b (server-side) |
| Email | Resend API (survey submission notifications) |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## Project Structure

```
validate-portal/
├── src/
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces (Project, Question, Interview, etc.)
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client singleton
│   │   ├── auth.ts             # useAuthUser() (isGuest), guest expiry, authHeaders() for /api calls
│   │   ├── ai.ts               # Groq wrapper — builds prompt, returns AnalysisResult JSON
│   │   └── utils.ts            # cn(), slugify(), uniqueSlug(), formatDate(), pct(), avg()
│   ├── store/
│   │   └── projectStore.ts     # Zustand store — project + questions + interviews + surveys + hypotheses + stats
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx      # Variants: primary / secondary / ghost / danger / outline
│   │   │   ├── Card.tsx        # Accent-border card + CardTitle
│   │   │   ├── Badge.tsx       # Colour badges (blue/green/yellow/red/orange/purple/neutral)
│   │   │   ├── Modal.tsx       # Modal + ConfirmModal
│   │   │   ├── Input.tsx       # Input, Textarea, Select (all with label/error/hint/tooltip)
│   │   │   ├── ProgressBar.tsx # ProgressBar + StatProgress
│   │   │   ├── EmptyState.tsx  # EmptyState + Skeleton + SkeletonCard
│   │   │   ├── Turnstile.tsx   # Cloudflare Turnstile CAPTCHA widget (no npm dependency)
│   │   │   ├── GuestSignIn.tsx # "Continue as guest" button used on Login + Signup
│   │   └── OnboardingWizard.tsx # 3-step welcome modal shown after first project creation
│   │   └── layout/
│   │   ├── AppShell.tsx    # Fixed sidebar nav + mobile bottom nav + project switcher dropdown
│       └── PageHeader.tsx  # Consistent page header with title + actions slot
│   ├── pages/
│   │   ├── Landing.tsx         # Marketing page + "Try it as a guest" link
│   │   ├── Login.tsx           # Email/password login + guest sign-in, behind Turnstile CAPTCHA
│   │   ├── Signup.tsx          # Email/password signup + guest sign-in, behind Turnstile CAPTCHA
│   │   ├── Profile.tsx         # Name, password, sign out, delete — and "Save your account" for guests
│   │   ├── Projects.tsx        # Project list — create / archive / delete
│   │   ├── Dashboard.tsx       # Per-project analytics (charts, stats, quote bank)
│   │   ├── SurveyBuilder.tsx   # Draft-mode question editor — changes require Save to persist
│   │   ├── Interviews.tsx      # Interview logger — log / edit / delete / expand + hypothesis tags
│   │   ├── Hypotheses.tsx      # Hypothesis Board — structured assumptions + status + AI verdict
│   │   ├── Analysis.tsx        # AI analysis — generate / regenerate / hypothesis assessment
│   │   ├── ProjectSettings.tsx # Tabbed settings — General / Survey / Analytics / Languages / Danger
│   │   └── PublicSurvey.tsx    # Unauthenticated /s/:slug survey form (step-by-step)
│   ├── App.tsx                 # React Router setup + RequireAuth + ProjectLoader
│   ├── main.tsx                # Root render + Toaster
│   └── index.css               # Tailwind import + CSS variable dark theme
├── supabase/
│   └── schema.sql              # 6 tables + indexes + RLS policies + migrations + guest cleanup cron job
├── api/
│   ├── _auth.ts                # Shared requireUser() — verifies the Supabase session (not a route)
│   ├── analyse.ts              # Vercel serverless function — Groq AI analysis + question generation
│   ├── translate-survey.ts     # Vercel serverless function — Groq survey translation (owner only)
│   ├── notify-survey.ts        # Vercel serverless function — emails project owner on survey submit
│   └── survey-meta.ts          # Vercel serverless function — dynamic OG tags for crawlers
├── public/
│   └── og-preview.png          # 1200×630 preview image shown in WhatsApp/iMessage/Telegram cards
├── vercel.json                 # SPA rewrite + bot-UA routing to survey-meta function
├── .env.example                # Environment variable template
└── vite.config.ts              # Tailwind plugin + @/ path alias
```

---

## Pages & Routes

| Route | Page | Auth |
|---|---|---|
| `/` | Landing | Public (redirects to `/app` if signed in) |
| `/login` | Login (+ Continue as guest) | Public |
| `/signup` | Signup (+ Continue as guest) | Public |
| `/s/:slug` | PublicSurvey | Public (no login) |
| `/a/:slug` | PublicAnalysis | Public (no login) |
| `/app` | Projects | Protected |
| `/profile` | Profile | Protected |
| `/p/:id` | Dashboard | Protected |
| `/p/:id/survey` | SurveyBuilder | Protected |
| `/p/:id/interviews` | Interviews | Protected |
| `/p/:id/hypotheses` | Hypotheses | Protected |
| `/p/:id/analysis` | Analysis | Protected |
| `/p/:id/settings` | ProjectSettings | Protected |

"Protected" routes accept both registered users and guests.

---

## Features

### Authentication & Guest Access
- **Email/password** sign-up and sign-in via Supabase Auth
- **Continue as guest** — try the full app with no sign-up, from the Login or Signup page (or "Try it as a guest" on the landing page)
  - Guests are Supabase **anonymous users**: a real user id with no email, so every RLS policy works unchanged and guests only ever see their own data
  - **Full access** — guests can create projects, build surveys, log interviews and use AI features
  - A banner across the app shows when the guest account will be deleted
  - Signing out as a guest asks for confirmation first (a guest session can't be signed back into)
- **7-day guest expiry** — guest accounts and all their projects are deleted 7 days after creation by an hourly `pg_cron` job
- **Save your account** (Profile page) — a guest adds an email, clicks the confirmation link, then sets a password. The user id stays the same, so all their projects carry over
- **CAPTCHA protection** — every sign-in, sign-up and guest session is protected by Cloudflare Turnstile; the token is verified server-side by Supabase Auth

### Projects
- Create projects with a name, description, interview target, and survey target
- Auto-generates a unique URL slug for the public survey
- Archive or delete projects
- Active / Archived tab filter
- **Onboarding wizard** — 3-step modal guides new users from project creation → survey builder → sharing link

### Survey Builder
- **Draft mode** — all changes (add, edit, delete, reorder, AI-generate) are local until the **Save** button is pressed; an "Unsaved changes" indicator appears when there are pending changes
- Question types: Short text, Long text, Pain rating (1–10), Scale (1–10), Yes/No, Single choice, Multi-choice
- **AI question generation** — generates 5 targeted questions from the project description via Groq, avoiding duplicates; goes into draft state until saved
- **AI translation** — translates all questions into enabled languages (configured in Settings)
- Drag-to-reorder questions
- Share panel with shareable public survey URL
- Copy or preview link in one click
- **Survey Responses panel** — view all responses, expand rows to see per-question answers, delete individual responses
- **Email notification** — project owner receives an email on every new survey submission (via Resend, automatic — no config needed per project)

### Public Survey (`/s/:slug`)
- Fully unauthenticated — no login required for respondents
- Step-by-step one-question-per-screen UX with progress bar
- Back/Next navigation with phantom-submit protection (transitioning guard)
- Custom welcome and thank-you messages (set in Project Settings)
- Stores response with region + answers in `survey_responses`

### Interview Tracker
- Log interviews with **participant name**, region, date, pain scores (per question), quotes, tags, notes
- Every field has a **tooltip** (`?` icon) explaining how it feeds into the AI analysis
- Pain scores: 1–10 per `rating`/`scale` question — avg ≥ 7 = strong pain signal
- Key quotes are verbatim and surfaced in the AI report as evidence
- Tags are comma-separated; most frequent tags across all interviews appear in the AI prompt
- Pilot-ready flag marks leads who would use/pay for the solution
- **Hypothesis linking** — multi-select which hypotheses an interview tested; `H1 H2` chips shown on the interview row
- Expand row to view quotes, notes, and individual pain scores (shows question labels, not IDs)
- Edit and delete
- **Project switcher** in sidebar — switch between projects without going back to the projects list; stays on the same page (e.g. stays on Interviews)

### Hypothesis Board
- Define structured pre-validation assumptions using a **Javelin-style template**: *I believe [customer] has [problem] and will pay [price] for [solution]*
- Hypothesis sentence is rendered with each token colour-coded; optional notes field for context
- **Status tracking** — Untested / Supported / Disproved / Pivoted; manually overridable inline per card
- `H1`, `H2`... index badges — each hypothesis is referenced by number across the app
- **Tested-in count** — each card shows how many interviews are linked to that hypothesis
- Add / edit modal with **live sentence preview** as you type
- **AI verdict integration** — when AI analysis runs, it assesses each hypothesis individually and returns a `hypothesis_verdicts` array with `supported / disproved / uncertain`, confidence level, reasoning, and evidence quote
- **Apply Verdicts button** in Analysis — writes AI-determined statuses back to Supabase in one click (skips `uncertain`)

### Dashboard
- Stat cards: total interviews, surveys, pain %, concept interest %, pilot-ready count
- Horizontal bar chart (Recharts) — per-question pain averages, colour-coded (red/yellow/green)
- Region breakdown with progress bars
- Quote bank from all interviews
- Recent activity feed (interviews + surveys combined, sorted by time)
- **Empty state action cards** — when no data exists, shows cards to build survey, log a conversation, or get AI verdict
- **Dark / Light mode toggle** in the sidebar (persisted to localStorage)

### Open Graph Link Previews
When a survey URL (`/s/:slug`) is pasted into WhatsApp, iMessage, Telegram, LinkedIn, Slack, etc., a rich preview card appears instead of a bare link.

- **Static fallback** — `index.html` contains `og:title`, `og:description`, `og:image`, and `twitter:card` meta tags that work for all URLs immediately
- **Preview image** — `public/og-preview.png` (1200×630 px) is the thumbnail shown in every chat preview
- **Dynamic per-project tags** — `api/survey-meta.ts` detects crawler user-agents, fetches the project name from Supabase, and serves an HTML stub with project-specific OG tags; real users are transparently redirected to the SPA
- **Bot routing** — `vercel.json` routes known crawler user-agents on `/s/:slug` to `api/survey-meta`, so humans always get the full React app

### AI Analysis
- Reads `analysis_cache` table for existing results
- "Generate Insights" sends aggregated stats + sample quotes to a **Vercel serverless function** (`api/analyse.ts`) which calls **Groq openai/gpt-oss-20b** server-side — the API key never reaches the browser
- AI endpoints (`/api/analyse`, `/api/translate-survey`) require a valid Supabase session (registered user or guest), so anonymous internet traffic can't spend Groq credits; translation also checks project ownership
- Displays: verdict badge, summary, themes with strength, key quotes, numbered next steps, warnings
- **Hypothesis Assessment section** — if hypotheses exist, each is assessed individually with a verdict (supported/disproved/uncertain), confidence (high/medium/low), reasoning, and evidence quote
- **Apply Verdicts** — one-click button writes AI-determined hypothesis statuses back to Supabase (uncertain = no change)
- "Regenerate" clears cache and re-runs
- **Shareable analysis link** — generates a public read-only URL to share results with stakeholders
- **PDF export** — exports full analysis + interview and survey response data as a printable PDF

### Project Settings
- **Tabbed layout** — General / Survey / Analytics / Languages / Danger Zone tabs keep the page uncluttered
- Map which survey questions feed each validation metric (pain, concept interest, pilot ready)
- Customise survey welcome and thank-you text
- Customise the public survey URL slug
- Enable survey translation languages
- Archive project (data preserved)

---

## Database Schema (Supabase)

```
projects          — id, user_id, name, slug, description, archived, target_*, settings (JSONB)
questions         — id, project_id, type, label, options[], required, display_order, translations (JSONB)
interviews        — id, project_id, user_id, participant, region, pain_scores (JSONB), quotes[], tags[], notes, pilot_ready, hypothesis_ids[], interviewed_at
survey_responses  — id, project_id, answers (JSONB), region, submitted_at
analysis_cache    — id, project_id, result (JSONB), created_at
hypotheses        — id, project_id, customer, problem, price, solution, notes, status, display_order, created_at
```

**RLS policies:**
- `projects`, `questions`, `interviews`, `analysis_cache`, `hypotheses` — owner-only (via `auth.uid()`)
- `questions`, `projects` — anon can **read** non-archived (required for public survey)
- `survey_responses` — anyone can **insert** (public survey), owner can select
- Guests (anonymous users) are covered by the same policies — `auth.uid()` is their own user id

**Guest cleanup:** `delete_expired_guests()` runs hourly via `pg_cron` (job `delete-expired-guests`) and deletes `auth.users` rows where `is_anonymous` and older than 7 days; `on delete cascade` removes their projects and child rows. Keep the 7 in sync with `GUEST_RETENTION_DAYS` in `src/lib/auth.ts`.

> **Migration note:** `schema.sql` is safe to re-run on an existing database — it adds the `hypotheses` table, the `hypothesis_ids` column, and the guest cleanup job. Enable the `pg_cron` extension first (**Database → Extensions**).

---

## AI Verdict Rules

The AI receives aggregated stats + up to 15 sample quotes and returns a structured JSON verdict:

| Verdict | Condition |
|---|---|
| Strong Signal | ≥ 5 interviews AND pain ≥ 70% AND concept ≥ 60% |
| Partial Signal | pain ≥ 50% OR concept ≥ 50% |
| Too Early | < 5 data points total |
| No Signal | Both pain < 50% and concept < 50% |

---

## Setup

### 1. Create `.env`
```
cp .env.example .env
```
Fill in your values:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=gsk_...              # server-side only — do NOT use VITE_ prefix
RESEND_API_KEY=re_...             # server-side only — for survey submission emails
SUPABASE_SERVICE_ROLE_KEY=eyJ... # server-side only — to look up owner email on survey submit
VITE_APP_URL=https://your-app.vercel.app  # optional — used for shareable survey links
VITE_ENABLE_GUEST=true                    # shows "Continue as guest"
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAFSAArW1hzd7xNuo  # optional — this key is the built-in default
```
For local development, `.env.local` works too (it's gitignored). Restart `npm run dev` after changing env vars — Vite reads them at startup.

### 2. Run the database schema
Open **Supabase Dashboard → SQL Editor**, paste `supabase/schema.sql`, and click **Run**.

### 3. Start the dev server
```
npm run dev
```
App runs at `http://localhost:5173`

### 4. Build for production
```
npm run build
```

---

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the `Habibwasi/Validation-Portal` GitHub repo
2. Vercel auto-detects Vite — no build config needed
3. Add environment variables in the Vercel dashboard before deploying:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY` ← **no `VITE_` prefix** — server-side only
   - `RESEND_API_KEY` ← server-side only — for survey notification emails
   - `SUPABASE_SERVICE_ROLE_KEY` ← server-side only — to look up project owner email
   - `VITE_APP_URL` ← set this to your Vercel URL after first deploy, then redeploy
   - `VITE_ENABLE_GUEST=true` ← shows "Continue as guest"
   - `VITE_TURNSTILE_SITE_KEY` ← optional; defaults to the project's Turnstile site key

   `VITE_*` variables are baked in at **build time** — redeploy after adding or changing them.
4. SPA client-side routing is handled by `vercel.json` (already included)
5. AI analysis + question generation is handled by `api/analyse.ts` — calls Groq server-side
6. Survey submission notifications are handled by `api/notify-survey.ts` — uses Resend to email the project owner automatically
7. Link preview cards are handled by `api/survey-meta.ts` — serves dynamic OG tags to crawlers; `vercel.json` routes bot user-agents to this function automatically. No extra config needed.

### Supabase Auth for production
If email confirmation is enabled, go to **Supabase Dashboard → Authentication → URL Configuration** and:
- Set **Site URL** to your Vercel URL
- Add `https://your-app.vercel.app/**` to **Redirect URLs**

Alternatively, disable email confirmation under **Authentication → Providers → Email** for internal/private tools.

### Guest access + CAPTCHA
Users can click **Continue as guest** to use the full app without signing up. Guests are Supabase anonymous users, so RLS treats them like any other owner.

1. **Supabase → Authentication → Sign In / Providers** → enable **Allow anonymous sign-ins**, and set `VITE_ENABLE_GUEST=true`.
2. **CAPTCHA (Cloudflare Turnstile):** the widget's site key is `0x4AAAAAAFSAArW1hzd7xNuo` — built into the app as the default, so no env var is needed. Its hostname list in Cloudflare must include your Vercel domain and `localhost`. Put the widget's **secret key** only in **Supabase → Authentication → Attack Protection → Enable CAPTCHA protection → Turnstile** — never in `.env` or the repo. Supabase Auth performs the server-side `siteverify` for every sign-in, sign-up and guest session, so the app has no siteverify endpoint of its own (and must not add one: tokens are single-use).
3. **Cleanup:** enable the `pg_cron` extension (**Database → Extensions**) before running `schema.sql`. The `delete-expired-guests` job deletes guest accounts (and their projects) 7 days after creation.
4. **Saving a guest account:** guests add an email on the Profile page; the confirmation link returns to `/profile?upgrade=1`, where they set a password. Their data is kept because the user id doesn't change. Make sure `https://your-app.vercel.app/**` is in **Redirect URLs** (see above).

#### Troubleshooting
| Symptom | Fix |
|---|---|
| `captcha_failed: no captcha_token found` | The deployed build has no CAPTCHA widget — redeploy the latest `main`, then hard-refresh (Ctrl+Shift+R) |
| `captcha_failed` mentioning an invalid/failed verification | The secret key in Supabase doesn't belong to widget `0x4AAAAAAFSAArW1hzd7xNuo` — re-copy it from Cloudflare |
| Turnstile widget shows an error instead of the check | Add the current domain (and `localhost` for dev) to the widget's hostnames in Cloudflare |
| "Anonymous sign-ins are disabled" | Enable **Allow anonymous sign-ins** in Supabase |
| AI features return "Sign in to use AI features" | The frontend and `api/` functions are out of sync — redeploy both from the same commit |
| Guest's confirmation link doesn't return to the app | Add `https://your-app.vercel.app/**` to Supabase **Redirect URLs** |
