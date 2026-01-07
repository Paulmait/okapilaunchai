-- Analytics and Feedback Tables
-- Migration: 0004_analytics_and_feedback.sql

-- ============================================
-- ANALYTICS EVENTS TABLE
-- Track all user actions for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text, -- nullable for anonymous events
    session_id text, -- browser session identifier
    event_type text NOT NULL, -- page_view, button_click, project_created, etc.
    event_name text NOT NULL, -- specific action name
    event_data jsonb DEFAULT '{}', -- additional event metadata
    page_path text, -- URL path where event occurred
    referrer text, -- where user came from
    user_agent text, -- browser info
    ip_hash text, -- hashed IP for geo analytics (privacy-safe)
    created_at timestamptz DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

-- ============================================
-- DAILY METRICS TABLE (aggregated for dashboards)
-- Pre-computed daily stats for fast dashboard queries
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    total_signups integer DEFAULT 0,
    total_projects_created integer DEFAULT 0,
    total_jobs_completed integer DEFAULT 0,
    total_exports_downloaded integer DEFAULT 0,
    total_page_views integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    avg_session_duration_sec integer DEFAULT 0,
    conversion_rate_signup numeric(5,2) DEFAULT 0, -- visitor to signup %
    conversion_rate_project numeric(5,2) DEFAULT 0, -- signup to project %
    revenue_usd numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date DESC);

-- ============================================
-- USER FEEDBACK TABLE
-- Collect feedback from users
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text, -- nullable for anonymous feedback
    feedback_type text NOT NULL, -- bug, feature_request, complaint, praise, general
    rating integer CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    message text NOT NULL,
    page_path text, -- where feedback was submitted
    context jsonb DEFAULT '{}', -- additional context (project_id, job_id, etc.)
    status text DEFAULT 'new', -- new, reviewed, resolved, ignored
    admin_notes text, -- internal notes from admin
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON public.user_feedback(feedback_type);

-- ============================================
-- NPS SCORES TABLE
-- Net Promoter Score tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.nps_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 10),
    reason text, -- why they gave this score
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nps_responses_created_at ON public.nps_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_responses_user_id ON public.nps_responses(user_id);

-- ============================================
-- API USAGE TABLE
-- Track API calls for abuse detection and billing
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text,
    endpoint text NOT NULL, -- /api/projects, /api/jobs, etc.
    method text NOT NULL, -- GET, POST, DELETE
    status_code integer,
    response_time_ms integer,
    request_size_bytes integer,
    response_size_bytes integer,
    ip_hash text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage(endpoint);

-- Partition by month for large-scale data (optional, uncomment if needed)
-- CREATE TABLE api_usage_2026_01 PARTITION OF api_usage FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ============================================
-- RATE LIMIT VIOLATIONS TABLE
-- Track blocked requests for security monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash text NOT NULL,
    user_id text,
    endpoint text NOT NULL,
    violation_count integer DEFAULT 1,
    first_violation_at timestamptz DEFAULT now(),
    last_violation_at timestamptz DEFAULT now(),
    is_blocked boolean DEFAULT false,
    blocked_until timestamptz
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON public.rate_limit_violations(ip_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_blocked ON public.rate_limit_violations(is_blocked);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Analytics events: service role only (admin access)
CREATE POLICY "Service role full access to analytics_events"
    ON public.analytics_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Daily metrics: service role only
CREATE POLICY "Service role full access to daily_metrics"
    ON public.daily_metrics FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- User feedback: users can view and create their own, service role full access
CREATE POLICY "Users can view their own feedback"
    ON public.user_feedback FOR SELECT
    USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can create feedback"
    ON public.user_feedback FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update feedback"
    ON public.user_feedback FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role');

-- NPS: users can view and create their own
CREATE POLICY "Users can view their own NPS"
    ON public.nps_responses FOR SELECT
    USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can create NPS response"
    ON public.nps_responses FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- API usage: service role only
CREATE POLICY "Service role full access to api_usage"
    ON public.api_usage FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Rate limit violations: service role only
CREATE POLICY "Service role full access to rate_limit_violations"
    ON public.rate_limit_violations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
