-- Enable Row Level Security on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Service role full access to projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view jobs for their projects" ON public.jobs;
DROP POLICY IF EXISTS "Users can create jobs for their projects" ON public.jobs;
DROP POLICY IF EXISTS "Service role full access to jobs" ON public.jobs;

DROP POLICY IF EXISTS "Users can view their own AI decisions" ON public.ai_decisions;
DROP POLICY IF EXISTS "Service role can insert AI decisions" ON public.ai_decisions;

DROP POLICY IF EXISTS "Users can view their own AI runs" ON public.ai_runs;
DROP POLICY IF EXISTS "Service role can insert AI runs" ON public.ai_runs;

-- Projects: users can only see/modify their own projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Service role bypass (for worker)
CREATE POLICY "Service role full access to projects"
  ON public.projects FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Jobs: users can view jobs for their projects
CREATE POLICY "Users can view jobs for their projects"
  ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = jobs.project_id
      AND (projects.user_id = auth.uid()::text OR projects.user_id = 'anonymous')
    )
  );

CREATE POLICY "Users can create jobs for their projects"
  ON public.jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
      AND (projects.user_id = auth.uid()::text OR projects.user_id = 'anonymous')
    )
  );

CREATE POLICY "Service role full access to jobs"
  ON public.jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- AI Decisions: users can view their own decisions
CREATE POLICY "Users can view their own AI decisions"
  ON public.ai_decisions FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'system');

CREATE POLICY "Service role can insert AI decisions"
  ON public.ai_decisions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- AI Runs: users can view their own runs
CREATE POLICY "Users can view their own AI runs"
  ON public.ai_runs FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'system');

CREATE POLICY "Service role can insert AI runs"
  ON public.ai_runs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
