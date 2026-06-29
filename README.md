# ⚡ QuizLive — Real-time Interactive Quiz Platform

A full-stack Mentimeter-style quiz application built with **Next.js 16**, **Supabase**, and deployed on **Vercel**. Host live quizzes with real-time leaderboards, speed-based scoring, and a stunning dark UI.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Quiz Builder** | Create quizzes with multiple-choice questions, configurable timers (5–60s), and correct answer selection |
| 🚀 **Live Sessions** | Launch sessions with a unique 6-digit room code — no app install needed for participants |
| ⚡ **Real-time Sync** | Questions, answers, and scores update instantly via Supabase Realtime WebSockets |
| 🏆 **Speed Scoring** | Kahoot-style scoring — correct answers earn up to 1,000 points based on response speed |
| 📊 **Live Results** | Host sees animated answer distribution bars as participants respond |
| 🥇 **Leaderboard** | Animated ranked leaderboard shown after every question and at the end |
| 🔐 **Auth** | Supabase email/password auth for hosts; participants join anonymously with a name |
| 🎨 **Premium Design** | Dark glassmorphism UI with animated gradient mesh, violet/cyan palette, smooth micro-animations |

---

## 🖥️ App Routes

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page with CTAs |
| `/auth` | Host | Login / Register |
| `/dashboard` | Host | View and manage your quizzes |
| `/dashboard/quiz/[id]` | Host | Quiz editor — add/edit/delete questions |
| `/dashboard/quiz/[id]/launch` | Host | Launch a live session |
| `/host/[sessionId]` | Host | Real-time control panel with live results |
| `/join` | Participant | Enter room code and display name |
| `/play/[sessionId]` | Participant | Live game view with timer and answer buttons |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, TypeScript, Server Actions)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL + Realtime)
- **Auth:** Supabase Auth (email/password)
- **Styling:** Vanilla CSS with a custom design system (no Tailwind)
- **Fonts:** Plus Jakarta Sans + Inter via Google Fonts
- **Deployment:** [Vercel](https://vercel.com)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ElieBalaa/MentiQuizz.git
cd MentiQuizz
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → New query
3. Paste and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
4. *(Optional)* Run [`supabase/migrations/002_seed_forensic_ai_quiz.sql`](supabase/migrations/002_seed_forensic_ai_quiz.sql) to load a sample quiz

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these values in your Supabase dashboard under **Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

```
auth.users          ← Supabase managed
  └── profiles      ← Host metadata
  └── quizzes       ← Quiz collections
       └── questions ← Multiple-choice questions (options stored as JSONB)
  └── sessions      ← Live game sessions (room_code, status, current_question)
       └── participants ← Anonymous players (display_name, score)
       └── answers      ← Per-question responses (chosen_option, time_taken_ms, points_earned)
```

**Row Level Security** is enabled on all tables. Realtime is enabled on `sessions`, `participants`, and `answers`.

---

## ⚙️ How Real-time Works

```
Host clicks "Next Question"
  → Server Action updates sessions.status + current_question_id
    → Supabase broadcasts Postgres change to all subscribers
      → Participants' useEffect fires → new question renders instantly

Participant selects an answer
  → Server Action inserts into answers + updates participant score
    → Host's useEffect fires → answer count increments live
```

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── page.tsx                # Login / Register
│   │   └── signout/route.ts        # Sign-out handler
│   ├── dashboard/
│   │   ├── page.tsx                # Quiz list
│   │   ├── DashboardClient.tsx     # Create quiz modal
│   │   └── quiz/[id]/
│   │       ├── page.tsx            # Quiz editor page
│   │       ├── QuizEditorClient.tsx
│   │       └── launch/             # Session launcher
│   ├── host/[sessionId]/
│   │   ├── page.tsx                # Host page (SSR)
│   │   └── HostControlPanel.tsx    # Real-time host UI
│   ├── join/page.tsx               # Room code entry
│   ├── play/[sessionId]/
│   │   ├── page.tsx                # Play page (SSR)
│   │   └── PlayClient.tsx          # Real-time participant UI
│   └── actions/
│       ├── quiz.ts                 # Quiz CRUD
│       ├── session.ts              # Session control
│       └── participant.ts          # Join + answer submission
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client (SSR)
│   │   └── middleware.ts           # Auth session refresh helper
│   └── types.ts                    # TypeScript database types
├── supabase/migrations/
│   ├── 001_initial_schema.sql      # Full schema with RLS
│   └── 002_seed_forensic_ai_quiz.sql # Sample quiz seed
├── proxy.ts                        # Auth route protection (Next.js 16)
└── vercel.json                     # Vercel config
```

---

## ☁️ Deploy to Vercel

1. Push to GitHub (already done ✅)
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` ← set to your Vercel deployment URL
4. Click **Deploy**

---

## 🎮 How to Play

**As a Host:**
1. Register at `/auth`
2. Create a quiz and add questions
3. Click **Launch** → share the 6-digit room code with participants
4. Click **Start Quiz** to begin
5. Use **Show Results** → **Show Leaderboard** → **Next Question** to control the flow

**As a Participant:**
1. Go to `/join`
2. Enter the room code and your name
3. Wait for the host to start
4. Tap an answer before the timer runs out — faster = more points!

---

## 📄 License

MIT © [Elie Balaa](https://github.com/ElieBalaa)
