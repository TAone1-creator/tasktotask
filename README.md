# Reestrutura — Plataforma de Reestruturação de Vida para Jovens

Uma plataforma digital que funciona como um ambiente guiado de organização e progresso pessoal, centralizada em quatro pilares: **Metas**, **Finanças**, **Hábitos** e **Tarefas**.

> "Não é um app para usar para sempre. É uma porta de entrada para uma vida mais organizada."

## Tech Stack

- **Frontend:** Next.js 15+ (App Router) com TypeScript e Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **UI Icons:** Lucide React
- **Charts:** Recharts
- **Dates:** date-fns

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables — create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` on your Supabase project.

4. Start the dev server:

```bash
npm run dev
```

## Modules

- **Metas (Goals):** Central axis — create, track, complete goals
- **Finanças (Finance):** Manual income/expense tracking, categories, savings boxes
- **Hábitos (Habits):** Daily check-ins, streaks, heatmap visualization
- **Tarefas (Tasks):** Categories, priorities, checklists, recurrence
- **Gamificação:** XP system, 10 levels, badges/achievements
- **Ciclo de Vida:** 3-6 month lifecycle with onboarding and closure report
