-- Performance indexes and login attempt tracking
-- Migration 0006

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Projects: Index for user lookup (common query pattern)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Jobs: Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_project_status ON public.jobs(project_id, status);

-- Subscriptions: User lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Usage: User lookup
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage(user_id);

-- Analytics events: Time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);

-- User feedback: Admin queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);

-- NPS responses: Time-based queries
CREATE INDEX IF NOT EXISTS idx_nps_responses_created_at ON public.nps_responses(created_at DESC);

-- ============================================
-- LOGIN ATTEMPT TRACKING
-- ============================================

-- Table to track login attempts for security monitoring
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  ip_hash TEXT, -- Hashed IP for privacy
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT, -- 'invalid_credentials', 'account_locked', 'rate_limited', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for security queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_hash ON public.login_attempts(ip_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON public.login_attempts(email, created_at DESC);

-- Partial index for failed attempts (most queried)
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed
  ON public.login_attempts(email, created_at DESC)
  WHERE success = false;

-- RLS for login attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (from auth hooks or server-side)
CREATE POLICY "Service role can manage login attempts"
  ON public.login_attempts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can read for security monitoring
CREATE POLICY "Admins can view login attempts"
  ON public.login_attempts FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ACCOUNT LOCKOUT TRACKING
-- ============================================

-- Table to track account lockouts
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlock_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL, -- 'too_many_attempts', 'suspicious_activity', 'admin_action'
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lockout checks
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON public.account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_unlock_at ON public.account_lockouts(unlock_at);

-- RLS for account lockouts
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage lockouts"
  ON public.account_lockouts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view lockouts"
  ON public.account_lockouts FOR SELECT
  USING (public.is_admin());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if an account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.account_lockouts
    WHERE email = check_email
    AND unlock_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to count recent failed login attempts
CREATE OR REPLACE FUNCTION public.count_recent_failed_attempts(
  check_email TEXT,
  window_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
  WHERE email = check_email
    AND success = false
    AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;

  RETURN attempt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  attempt_email TEXT,
  attempt_ip TEXT,
  attempt_user_agent TEXT,
  attempt_success BOOLEAN,
  attempt_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  ip_hashed TEXT;
BEGIN
  -- Hash the IP address for privacy
  ip_hashed := encode(sha256(attempt_ip::bytea), 'hex');

  INSERT INTO public.login_attempts (
    email, ip_address, ip_hash, user_agent, success, failure_reason
  ) VALUES (
    attempt_email, attempt_ip, ip_hashed, attempt_user_agent, attempt_success, attempt_failure_reason
  ) RETURNING id INTO new_id;

  -- If failed, check if we need to lock the account
  IF NOT attempt_success THEN
    DECLARE
      failed_count INTEGER;
    BEGIN
      failed_count := public.count_recent_failed_attempts(attempt_email, 15);

      -- Lock account after 5 failed attempts in 15 minutes
      IF failed_count >= 5 THEN
        INSERT INTO public.account_lockouts (email, unlock_at, reason, failed_attempts, last_attempt_ip)
        VALUES (attempt_email, NOW() + INTERVAL '30 minutes', 'too_many_attempts', failed_count, attempt_ip)
        ON CONFLICT (email) DO UPDATE SET
          unlock_at = NOW() + INTERVAL '30 minutes',
          failed_attempts = EXCLUDED.failed_attempts,
          last_attempt_ip = EXCLUDED.last_attempt_ip,
          updated_at = NOW();
      END IF;
    END;
  ELSE
    -- On successful login, clear any lockouts
    DELETE FROM public.account_lockouts WHERE email = attempt_email;
  END IF;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.login_attempts IS 'Tracks all login attempts for security monitoring';
COMMENT ON TABLE public.account_lockouts IS 'Tracks locked accounts due to failed login attempts';
COMMENT ON FUNCTION public.is_account_locked IS 'Check if an account is currently locked';
COMMENT ON FUNCTION public.count_recent_failed_attempts IS 'Count failed login attempts in recent time window';
COMMENT ON FUNCTION public.record_login_attempt IS 'Record a login attempt and handle lockouts';
