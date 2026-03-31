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
| AI Analysis | Groq (llama-3.3-70b-versatile, free tier) |
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
│   │   ├── ai.ts               # Gemini wrapper — builds prompt, returns AnalysisResult JSON
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
├── api/
│   ├── analyse.ts              # Vercel serverless function — Gemini AI analysis
│   ├── translate-survey.ts     # Vercel serverless function — Gemini multi-language translation
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
- **Language picker step** — respondents choose their preferred language before the survey starts (auto-skipped if only English is enabled)
- Supported languages: English 🇬🇧, Arabic 🇸🇦, Bengali 🇧🇩, French 🇫🇷, Spanish 🇪🇸, Turkish 🇹🇷, Hindi 🇮🇳, Danish 🇩🇰, German 🇩🇪
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

### Open Graph Link Previews
When a survey URL (`/s/:slug`) is pasted into WhatsApp, iMessage, Telegram, LinkedIn, Slack, etc., a rich preview card appears instead of a bare link.

- **Static fallback** — `index.html` contains `og:title`, `og:description`, `og:image`, and `twitter:card` meta tags that work for all URLs immediately
- **Preview image** — `public/og-preview.png` (1200×630 px) is the thumbnail shown in every chat preview
- **Dynamic per-project tags** — `api/survey-meta.ts` detects crawler user-agents, fetches the project name from Supabase, and serves an HTML stub with project-specific OG tags; real users are transparently redirected to the SPA
- **Bot routing** — `vercel.json` routes known crawler user-agents on `/s/:slug` to `api/survey-meta`, so humans always get the full React app

### AI Analysis
- Reads `analysis_cache` table for existing results
- "Generate Insights" sends aggregated stats + sample quotes to a **Vercel serverless function** (`api/analyse.ts`) which calls **Groq (llama-3.3-70b-versatile)** server-side — the API key never reaches the browser
- Displays: verdict badge, summary, themes with strength, key quotes, numbered next steps, warnings
- "Regenerate" clears cache and re-runs

### Project Settings
- Map which survey questions feed each validation metric (pain, concept interest, pilot ready)
- Customise survey welcome and thank-you text
- **Survey Languages** — toggle which languages to enable for the public survey
- **Generate Translations** — one-click AI translation of all question labels and options into every enabled language (powered by Groq via `api/translate-survey.ts`); translations are stored in the `questions.translations` JSONB column
- Archive project (data preserved)

---

## Database Schema (Supabase)

```
projects          — id, user_id, name, slug, description, archived, target_*, settings (JSONB)
questions         — id, project_id, type, label, options[], required, display_order, translations (JSONB)
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
GROQ_API_KEY=your-groq-api-key   # server-side only — get free key at console.groq.com/keys
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
   - `GROQ_API_KEY` ← **no `VITE_` prefix** — kept server-side only, never in the bundle. Get a free key at [console.groq.com/keys](https://console.groq.com/keys) (no credit card required, 14,400 req/day free)
   - `VITE_APP_URL` ← set this to your Vercel URL after first deploy, then redeploy
4. SPA client-side routing is handled by `vercel.json` (already included)
5. AI analysis is handled by `api/analyse.ts` — a Vercel serverless function that calls **Groq (llama-3.3-70b-versatile)** server-side
6. Survey translation is handled by `api/translate-survey.ts` — translates all questions into enabled languages via Groq and saves to the DB
7. Link preview cards are handled by `api/survey-meta.ts` — serves dynamic OG tags to crawlers; `vercel.json` routes bot user-agents to this function automatically. No extra config needed.

### Supabase Auth for production
If email confirmation is enabled, go to **Supabase Dashboard → Authentication → URL Configuration** and:
- Set **Site URL** to your Vercel URL
- Add `https://your-app.vercel.app/**` to **Redirect URLs**

Alternatively, disable email confirmation under **Authentication → Providers → Email** for internal/private tools.
