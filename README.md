# OkapiLaunch AI (NexGEN Launch AI)

OkapiLaunch AI is an outcome-driven app builder focused on **App Store-ready iOS apps** (Expo + React Native),
including compliance artifacts (privacy/terms/EULA), screenshot specs, and exportable project packages.

## Features

- **Project Wizard**: 4-step wizard to configure your app (name, category, features, compliance)
- **AI-Powered Generation**: Multi-provider LLM router (OpenAI + Anthropic) with cost-aware routing
- **Job Pipeline**: Automatic progression through plan -> build_mvp -> export stages
- **Export Package**: Complete Expo project with legal docs and screenshot specs
- **Supabase Integration**: Auth, database, and storage for projects and exports

## Repository Structure

```
apps/
  web/          Next.js 14 UI + API routes
  worker/       Job processor with task graph execution

packages/
  ai-router/    Multi-provider, cost-aware LLM router
  core/         Shared types, schemas (Zod), and task graph interfaces
  templates/    Expo + legal templates

supabase/
  migrations/   Database schema and RLS policies

scripts/
  e2e.ts        End-to-end test for full pipeline validation
```

## Quick Start (Windows / PowerShell)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (local or cloud)

### 1. Install Dependencies

```powershell
pnpm install
```

### 2. Set Up Supabase

Create a Supabase project and apply migrations:

```powershell
# If using Supabase CLI
supabase db push

# Or manually run the SQL files in supabase/migrations/
```

### 3. Configure Environment

```powershell
# Copy example env files
copy .env.example apps/web/.env.local
copy .env.example apps/worker/.env

# Edit the files with your actual values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
```

### 4. Build and Run

```powershell
# Build all packages
pnpm build

# Start development servers (web + worker)
pnpm dev
```

The web app runs at http://localhost:3000

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start web and worker in development mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test:e2e` | Run end-to-end pipeline test |

## Job Pipeline

When you create a project through the wizard, jobs are automatically queued:

1. **plan**: Generates architecture plan using AI
2. **build_mvp**: Creates Expo project with code, legal docs, and screenshot specs
3. **export**: Zips artifacts and uploads to Supabase Storage

The project page shows real-time progress and provides download when complete.

## Security

- Supabase Auth for user authentication
- Row-Level Security (RLS) policies on all tables
- Service role key used only server-side
- Signed URLs for secure file downloads (10-minute TTL)
- Input validation with Zod on all API endpoints

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `DEFAULT_PROJECT_BUDGET_USD` | Budget limit per project (default: 3.00) |
| `WORKER_POLL_INTERVAL_MS` | Worker polling interval (default: 3000) |

## Development Notes

- The AI router uses Claude for planning/compliance/legal and OpenAI for code generation
- Budget guardrails automatically downgrade to cheaper models when budget is low
- Repair loops retry failed LLM calls up to 3 times with corrective prompts
- Exports are stored in Supabase Storage bucket named `exports`
