# OkapiLaunch AI - Project Status Document

**Last Updated:** January 7, 2026
**Status:** Production (Railway Deployed)
**Live URL:** https://okapilaunchweb-production.up.railway.app

---

## Architecture Overview

### Monorepo Structure
```
okapilaunchai/
├── apps/
│   ├── web/           # Next.js 14 frontend + API routes
│   └── worker/        # Background job processor
├── packages/
│   ├── core/          # Shared types and schemas
│   ├── ai-router/     # Multi-provider LLM routing
│   └── templates/     # Expo app templates
├── supabase/
│   └── migrations/    # Database schema migrations
└── scripts/           # Build and deployment scripts
```

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18
- **Backend:** Next.js API Routes, Node.js Worker
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (exports bucket)
- **Auth:** Supabase Auth (email/password, magic link)
- **Payments:** Stripe (subscriptions)
- **Hosting:** Railway (web + worker services)
- **AI:** OpenAI GPT-4, Anthropic Claude

---

## Database Schema

### Core Tables
- `projects` - User projects with wizard payload
- `jobs` - Background job queue (plan, build_mvp, export)
- `ai_decisions` - AI model routing decisions
- `ai_runs` - Individual AI API calls

### Analytics Tables
- `analytics_events` - User behavior tracking
- `user_feedback` - In-app feedback submissions
- `nps_responses` - Net Promoter Score surveys

### Subscription Tables (NEW)
- `subscriptions` - Stripe subscription data per user
- `usage` - Project count and limits per user

### Key Relationships
```
users (auth.users)
  ├── projects (1:many)
  │   └── jobs (1:many)
  ├── subscriptions (1:1)
  └── usage (1:1)
```

---

## Pricing Model

| Plan | Price | Projects | Features |
|------|-------|----------|----------|
| Free | $0 one-time | 1 lifetime | Basic export, legal docs |
| Pro | $29/month | Unlimited | Code editor, GitHub integration, priority AI |
| Team | $79/month | Unlimited | Everything + 5 team members, priority support |

---

## API Endpoints

### Projects
- `POST /api/projects` - Create project (requires auth, checks limits)
- `GET /api/projects` - List user's projects

### Jobs
- `GET /api/jobs/[jobId]` - Get job status and payload
- `POST /api/jobs/[jobId]/download` - Get signed download URL

### Usage & Subscription
- `GET /api/usage` - Get user's usage stats and subscription
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Auth
- `GET /api/auth/callback` - OAuth callback handler

---

## Key Pages

### Public
- `/` - Landing page with features and CTA
- `/pricing` - Pricing plans
- `/login` - Sign in form
- `/signup` - Registration form

### Authenticated
- `/dashboard` - Project list
- `/new` - 4-step project wizard
- `/projects/[id]` - Project detail with AI status
- `/projects/[id]/editor` - Monaco code editor (Pro)
- `/projects/[id]/github` - GitHub integration (Pro)
- `/publish` - App Store publishing workflow
- `/subscribe` - Subscription checkout
- `/subscribe/success` - Post-payment confirmation

---

## Environment Variables

### Required for Web
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

### Required for Stripe (Optional until configured)
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
```

### Required for Worker
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Deployment (Railway)

### Services
1. **okapilaunchweb** - Next.js web app
   - Build: `pnpm install && pnpm -r --filter @okapilaunch/core build && cd apps/web && pnpm build`
   - Start: `cd /app/apps/web && pnpm start`
   - Port: Uses `$PORT` env variable

2. **okapilaunchworker** - Background job processor
   - Build: `pnpm -r --filter @okapilaunch/core --filter @okapilaunch/ai-router --filter @okapilaunch/worker build`
   - Start: `node apps/worker/dist/main.js`

### Deployment Process
```bash
git add .
git commit -m "feat: description"
git push  # Triggers Railway auto-deploy
```

---

## Recent Changes (January 7, 2026)

### Security Fixes (QC Review)
- **CRITICAL**: Added admin route protection in middleware (`/admin` now requires admin email)
- **CRITICAL**: Added admin role checks to `/api/analytics` and `/api/feedback` GET endpoints
- **CRITICAL**: Added manual usage counter increment after project creation (backup for DB trigger)
- Added `/publish` and `/subscribe` to protected routes in middleware
- Created `lib/admin.ts` helper for admin authorization

### Subscription System
- Added `subscriptions` and `usage` database tables
- Stripe integration with checkout and webhooks
- Usage limit enforcement (1 free project lifetime)
- Auto-initialization of records for new users

### Pro Features
- Monaco code editor at `/projects/[id]/editor`
- GitHub integration at `/projects/[id]/github`
- Publish workflow at `/publish`

### UI Updates
- Added Publish button to navigation header
- Edit Code and Push to GitHub buttons on project sidebar
- Updated pricing page with new tiers
- **NEW**: Added toast notification system (replaced all `alert()` calls)
- Toast provider wraps entire app via `components/Providers.tsx`

### Bug Fixes
- Fixed `.single()` query errors for new users (changed to `.maybeSingle()`)
- Auto-create subscription/usage records on first API call
- Replaced browser `alert()` with toast notifications across all pages

### Performance Improvements (Latest)
- **Fixed N+1 queries**: Dashboard and Publish pages now use Supabase joins to fetch projects with jobs in a single query
- API `/api/projects` GET now returns `latestJob` inline with each project

### Backend Selection
- **Removed Firebase option** from wizard - all apps now use Supabase backend
- Firebase support noted as "coming soon" in UI

### Placeholder Features (Clearly Marked)
- **GitHub Integration**: Added "Coming Soon" banner - OAuth integration in development
- **Code Editor**: Added "Preview Mode" banner - demo with sample files, not connected to real project
- **App Store Publish**: Added "Automated Publishing Coming Soon" banner - users should use Transporter for now

### Rate Limiting Documentation
- Added comprehensive documentation to `lib/rate-limit.ts` explaining:
  - In-memory limitations on multi-instance deployments
  - Production recommendations (Redis/Upstash)
  - Current behavior: `effective_limit = limit × number_of_instances`

---

## Known Issues / TODO

### Pending
- [ ] Stripe price IDs need to be created in Stripe Dashboard
- [ ] GitHub OAuth integration (placeholder UI with "Coming Soon" banner)
- [ ] App Store Connect integration for Publish feature (placeholder UI with banner)
- [ ] Code editor file persistence (demo mode with sample files)
- [ ] Migrate rate limiting to Redis for multi-instance scaling

### Technical Debt
- [ ] Add proper error boundaries
- [ ] Add loading skeletons
- [ ] Add E2E tests for subscription flow
- [ ] Add monitoring/alerting

### Completed (This Session)
- [x] Fixed N+1 query patterns in dashboard and publish pages
- [x] Removed Firebase placeholder option (Supabase only)
- [x] Added "Coming Soon" banners to placeholder features
- [x] Documented rate limiting limitations

---

## Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Start web only
pnpm dev:worker       # Start worker only

# Building
pnpm build            # Build all packages
pnpm build:web        # Build web app
pnpm build:worker     # Build worker

# Database
node scripts/migrate.mjs  # Run migrations

# Testing
pnpm test             # Run tests
node scripts/e2e.ts   # Run E2E tests
```

---

## Support

- **Email:** support@okapilaunch.com
- **GitHub Issues:** https://github.com/Paulmait/okapilaunchai/issues
