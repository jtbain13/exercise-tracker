# ⚡ Exercise Tracker

A lightweight, mobile-friendly exercise tracker built with React + Supabase. Designed for fast logging at the gym.

## Features

- **Quick set logging** — pick exercise, enter reps/weight, log. Set number auto-increments
- **Strength + Cardio** — separate flows for lifting (sets/reps/weight) and cardio (distance/duration/elevation/vest/ruck weight)
- **Exercise library** — 30+ pre-loaded exercises, add your own
- **History** — expandable workout cards with full set details
- **Stats** — weekly volume, streak, PRs, muscle distribution, 28-day activity heatmap
- **Dark mode** — auto-detects system preference, manual toggle
- **Responsive** — works on phone and desktop

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + REST API)
- **Hosting:** Vercel

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open the **SQL Editor** and run everything in `supabase-schema.sql`
3. Go to **Settings → API** and copy your project URL and anon key

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Database Schema

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise library with name, category, muscle group, type |
| `workouts` | One record per gym session (date, optional name/notes) |
| `sets` | One row per set performed (reps, weight, duration) |
| `cardio_log` | Cardio entries (distance, duration, elevation, vest/ruck weight) |

## License

MIT
