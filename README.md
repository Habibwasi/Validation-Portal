# Validate Portal

A general-purpose startup validation research tool. Create projects, build public surveys, log customer interviews, and get AI-powered signal analysis — all in one dark-themed SPA.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 5.9 |
| Styling | Tailwind CSS v4 (CSS-variables dark theme) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| State | Zustand |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core + sortable |
| AI Analysis | OpenAI gpt-4o-mini |
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
│   │   ├── ai.ts               # OpenAI wrapper — builds prompt, returns AnalysisResult JSON
│   │   └── utils.ts            # cn(), slugify(), uniqueSlug(), formatDate(), pct(), avg()
│   ├── store/
│   │   └── projectStore.ts     # Zustand store — project + questions + interviews + surveys + stats
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx      # Variants: primary / secondary / ghost / danger / outline
│   │   │   ├── Card.tsx        # Accent-border card + CardTitle
│   │   │   ├── Badge.tsx       # Colour badges (blue/green/yellow/red/orange/purple/neutral)
│   │   │   ├── Modal.tsx       # Modal + ConfirmModal
│   │   │   ├── Input.tsx       # Input, Textarea, Select (all with label/error/hint/tooltip)
│   │   │   ├── ProgressBar.tsx # ProgressBar + StatProgress
│   │   │   └── EmptyState.tsx  # EmptyState + Skeleton + SkeletonCard
│   │   └── layout/
│   │       ├── AppShell.tsx    # Fixed sidebar nav + project switcher dropdown
│   │       └── PageHeader.tsx  # Consistent page header with title + actions slot
│   ├── pages/
│   │   ├── Login.tsx           # Email/password login (Supabase auth)
│   │   ├── Signup.tsx          # Email/password signup + confirmation redirect
│   │   ├── Projects.tsx        # Project list — create / archive / delete
│   │   ├── Dashboard.tsx       # Per-project analytics (charts, stats, quote bank)
│   │   ├── SurveyBuilder.tsx   # Drag-to-reorder question editor + shareable link + response list
│   │   ├── Interviews.tsx      # Interview logger — log / edit / delete / expand
│   │   ├── Analysis.tsx        # AI analysis — generate / regenerate / display results
│   │   ├── ProjectSettings.tsx # Metric mapping + survey copy + archive
│   │   └── PublicSurvey.tsx    # Unauthenticated /s/:slug survey form (step-by-step)
│   ├── App.tsx                 # React Router setup + RequireAuth + ProjectLoader
│   ├── main.tsx                # Root render + Toaster
│   └── index.css               # Tailwind import + CSS variable dark theme
├── supabase/
│   └── schema.sql              # 5 tables + indexes + RLS policies
├── vercel.json                 # SPA rewrite rule for Vercel deployment
├── .env.example                # Environment variable template
└── vite.config.ts              # Tailwind plugin + @/ path alias
```

---

## Pages & Routes

| Route | Page | Auth |
|---|---|---|
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/s/:slug` | PublicSurvey | Public (no login) |
| `/` | Projects | Protected |
| `/p/:id` | Dashboard | Protected |
| `/p/:id/survey` | SurveyBuilder | Protected |
| `/p/:id/interviews` | Interviews | Protected |
| `/p/:id/analysis` | Analysis | Protected |
| `/p/:id/settings` | ProjectSettings | Protected |

---

## Features

### Projects
- Create projects with a name, description, interview target, and survey target
- Auto-generates a unique URL slug for the public survey
- Archive or delete projects
- Active / Archived tab filter

### Survey Builder
- Add, edit, delete, and **drag-to-reorder** questions
- Question types: Short text, Long text, Pain rating (1–10), Scale (1–10), Yes/No, Single choice, Multi-choice
- Share panel with shareable public survey URL — uses `VITE_APP_URL` in production, falls back to `window.location.origin`
- Copy or preview in one click
- **Survey Responses panel** at the bottom — view all submitted responses, expand any row to see per-question answers, and delete individual responses

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
- Expand row to view quotes, notes, and individual pain scores (shows question labels, not IDs)
- Edit and delete
- **Project switcher** in sidebar — switch between projects without going back to the projects list; stays on the same page (e.g. stays on Interviews)

### Dashboard
- Stat cards: total interviews, surveys, pain %, concept interest %, pilot-ready count
- Horizontal bar chart (Recharts) — per-question pain averages, colour-coded (red/yellow/green)
- Region breakdown with progress bars
- Quote bank from all interviews
- Recent activity feed (interviews + surveys combined, sorted by time)

### AI Analysis
- Reads `analysis_cache` table for existing results
- "Generate Insights" sends aggregated stats + sample quotes to a **Vercel serverless function** (`api/analyse.ts`) which calls OpenAI gpt-4o-mini server-side — the API key never reaches the browser
- Displays: verdict badge, summary, themes with strength, key quotes, numbered next steps, warnings
- "Regenerate" clears cache and re-runs

### Project Settings
- Map which survey questions feed each validation metric (pain, concept interest, pilot ready)
- Customise survey welcome and thank-you text
- Archive project (data preserved)

---

## Database Schema (Supabase)

```
projects          — id, user_id, name, slug, description, archived, target_*, settings (JSONB)
questions         — id, project_id, type, label, options[], required, display_order
interviews        — id, project_id, user_id, participant, region, pain_scores (JSONB), quotes[], tags[], notes, pilot_ready, interviewed_at
survey_responses  — id, project_id, answers (JSONB), region, submitted_at
analysis_cache    — id, project_id, result (JSONB), created_at
```

**RLS policies:**
- `projects`, `questions`, `interviews`, `analysis_cache` — owner-only (via `auth.uid()`)
- `questions`, `projects` — anon can **read** non-archived (required for public survey)
- `survey_responses` — anyone can **insert** (public survey), owner can select

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
OPENAI_API_KEY=sk-...             # server-side only — do NOT use VITE_ prefix
VITE_APP_URL=https://your-app.vercel.app  # optional — used for shareable survey links
```

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
   - `OPENAI_API_KEY` ← **no `VITE_` prefix** — kept server-side only, never in the bundle
   - `VITE_APP_URL` ← set this to your Vercel URL after first deploy, then redeploy
4. SPA client-side routing is handled by `vercel.json` (already included)
5. AI analysis is handled by `api/analyse.ts` — a Vercel serverless function that calls OpenAI server-side

### Supabase Auth for production
If email confirmation is enabled, go to **Supabase Dashboard → Authentication → URL Configuration** and:
- Set **Site URL** to your Vercel URL
- Add `https://your-app.vercel.app/**` to **Redirect URLs**

Alternatively, disable email confirmation under **Authentication → Providers → Email** for internal/private tools.
