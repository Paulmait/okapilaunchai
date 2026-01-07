# OkapiLaunch AI - Railway Deployment Guide

Deploy both the web app and worker on Railway from a single repo.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repo connected to Railway
- Supabase project with migrations applied

## Step 1: Create Railway Project

1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose your `okapilaunchai` repository
4. Railway will create a project

## Step 2: Deploy Web App

1. In your Railway project, click **"New Service"** → **"GitHub Repo"**
2. Select the same repo
3. Configure the service:

   **Settings:**
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm install && pnpm build:web`
   - **Start Command:** `pnpm start`

   **Variables (add these):**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dgezhxhqmiaghvlmqvxd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   PORT=3000
   ```

4. Click **Deploy**

## Step 3: Deploy Worker

1. Click **"New Service"** → **"GitHub Repo"** again
2. Select the same repo
3. Configure the service:

   **Settings:**
   - **Root Directory:** `apps/worker`
   - **Build Command:** `cd ../.. && pnpm install && pnpm build:worker`
   - **Start Command:** `node dist/main.js`

   **Variables (add these):**
   ```
   SUPABASE_URL=https://dgezhxhqmiaghvlmqvxd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   OPENAI_API_KEY=<your-openai-key>
   ANTHROPIC_API_KEY=<your-anthropic-key>
   DEFAULT_PROJECT_BUDGET_USD=3.00
   WORKER_POLL_INTERVAL_MS=3000
   ```

4. Click **Deploy**

## Step 4: Add Custom Domain (Optional)

1. In the web service, go to **Settings** → **Networking**
2. Click **"Generate Domain"** for a free `*.up.railway.app` subdomain
3. Or add your custom domain when ready

## Environment Variables Reference

### Web App
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `PORT` | No | Defaults to 3000 |

### Worker
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `DEFAULT_PROJECT_BUDGET_USD` | No | Default: 3.00 |
| `WORKER_POLL_INTERVAL_MS` | No | Default: 3000 |

## Verify Deployment

1. **Web App:** Visit your Railway URL, you should see the landing page
2. **Worker:** Check Railway logs - should show "Worker started, polling for jobs..."
3. **Create a test project** through the web UI and verify jobs are processed

## Troubleshooting

### Build fails
- Check that `pnpm-lock.yaml` is committed
- Verify root `package.json` has correct scripts

### Worker not processing jobs
- Check environment variables are set correctly
- Verify Supabase connection in logs
- Check for queued jobs in Supabase dashboard

### Database connection errors
- Ensure RLS policies are applied (`node scripts/migrate.mjs`)
- Verify service role key is correct

## Costs

Railway free tier includes:
- $5 free credit/month
- Enough for small-scale testing

For production, expect ~$5-20/month depending on usage.
