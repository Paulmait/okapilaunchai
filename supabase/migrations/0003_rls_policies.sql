-- Enable Row Level Security on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

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

-- AI Decisions: users can view their own decisions
CREATE POLICY "Users can view their own AI decisions"
  ON public.ai_decisions FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'system');

CREATE POLICY "System can insert AI decisions"
  ON public.ai_decisions FOR INSERT
  WITH CHECK (true);

-- AI Runs: users can view their own runs
CREATE POLICY "Users can view their own AI runs"
  ON public.ai_runs FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'system');

CREATE POLICY "System can insert AI runs"
  ON public.ai_runs FOR INSERT
  WITH CHECK (true);

-- Service role bypass for worker operations
-- Note: Service role key automatically bypasses RLS

-- Storage bucket policies (for exports)
-- The service role is used for uploads, so we only need download policies

-- Create policy for authenticated users to download their exports
INSERT INTO storage.policies (name, bucket_id, definition)
SELECT
  'Users can download their exports',
  id,
  jsonb_build_object(
    'operation', 'SELECT',
    'definition', 'bucket_id = ''exports'' AND auth.role() = ''authenticated'''
  )
FROM storage.buckets
WHERE name = 'exports'
ON CONFLICT DO NOTHING;
