# OkapiLaunch AI — Claude Operating Guide (NexGEN Launch AI)

You are Claude Code working inside the OkapiLaunch AI monorepo.
Your mission is to help build **NexGEN Launch AI** (product name may be "OkapiLaunch AI"),
a focused, App Store–first app builder that rivals Rork by guaranteeing outcome quality:
**App Store–ready iOS apps** (Expo + React Native) + compliance + assets + export.

## Non-negotiable product goals
1) **Outcome over novelty**: prioritize reliability, compliance, and repeatability.
2) **App Store compliance** is a first-class feature (privacy, delete-my-data, paywall clarity).
3) **Stay in ecosystem**: users should not need to leave OkapiLaunch AI to ship.
4) **Cost-aware multi-AI routing**: users do not choose models; router does.
5) **Deterministic artifacts**: every run produces a downloadable export package.

## Repo structure
- apps/web: Next.js UI + API routes (project wizard, status, downloads)
- apps/worker: job runner that executes task graphs and produces exports
- packages/ai-router: multi-provider LLM router (OpenAI + Anthropic)
- packages/core: shared types (task graph)
- packages/templates: Expo + legal + screenshot templates
- supabase/migrations: schema + storage bucket setup

## Implementation rules
- Prefer TypeScript everywhere.
- Keep changes minimal, incremental, and testable.
- Avoid introducing heavy infra unless necessary.
- If you change DB schema, add a new migration file; do not edit existing migrations unless unavoidable.
- Use Supabase service role ONLY server-side (web API routes and worker).
- Never expose secret keys to the browser.

## Definition of Done for core flows
### Create Project
- Web wizard creates `projects` row
- Web queues `jobs` row with wizard payload
- UI redirects to Project page showing job status

### Build / Export
- Worker picks queued job, copies Expo template, runs task graph, writes artifacts
- Worker zips artifacts, uploads `export.zip` to Supabase Storage bucket `exports/`
- Worker stores `artifact_bucket` and `artifact_object_path` in job payload

### Download
- Web API returns signed URL for the job export (short TTL)
- UI shows “Download export” button when job succeeded

## Guardrails for LLM usage
- Use Claude for planning/compliance/legal/fix loops
- Use OpenAI for code generation/copy/screenshot captions
- Enforce budget guardrail in router
- Use repair loops when output format is invalid (JSON required)

## Coding conventions
- Use small functions, clear names, and explicit error handling.
- Log only what is safe; do not log secrets.
- Validate incoming API payloads with Zod.
- Keep UI simple and fast; focus on the wizard + status + download.

## Next priorities (short list)
1) Project page: status polling + download button
2) Signed URL API route for job exports
3) Storage bucket migration + worker upload implementation
4) Optional: store exports in Storage with per-user access controls (later)

If anything conflicts, prioritize the Non-negotiable product goals above.
