-- Job state + single-flight lock for background workers
CREATE TABLE public.worker_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'idle',
  locked_until TIMESTAMP WITH TIME ZONE,
  lock_token UUID,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_cursor TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  pause_reason TEXT,
  last_error TEXT,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.worker_jobs TO authenticated;
GRANT ALL ON public.worker_jobs TO service_role;
ALTER TABLE public.worker_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view worker jobs"
ON public.worker_jobs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_worker_jobs_updated_at
BEFORE UPDATE ON public.worker_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-connection reconciliation checkpoints (idempotent progress marking)
CREATE TABLE public.reconciliation_checkpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_connection_id UUID NOT NULL REFERENCES public.broker_connections(id) ON DELETE CASCADE,
  last_reconciled_at TIMESTAMP WITH TIME ZONE,
  last_fill_ts TIMESTAMP WITH TIME ZONE,
  last_status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  positions_checked INTEGER NOT NULL DEFAULT 0,
  drifts_found INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (broker_connection_id)
);

GRANT SELECT ON public.reconciliation_checkpoints TO authenticated;
GRANT ALL ON public.reconciliation_checkpoints TO service_role;
ALTER TABLE public.reconciliation_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reconciliation checkpoints"
ON public.reconciliation_checkpoints FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reconciliation_checkpoints_updated_at
BEFORE UPDATE ON public.reconciliation_checkpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Detected drift between broker truth and the internal book
CREATE TABLE public.position_drifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_connection_id UUID REFERENCES public.broker_connections(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  drift_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  internal_quantity NUMERIC,
  broker_quantity NUMERIC,
  quantity_diff NUMERIC,
  internal_avg_price NUMERIC,
  broker_avg_price NUMERIC,
  fingerprint TEXT NOT NULL,
  auto_corrected BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (fingerprint)
);

CREATE INDEX idx_position_drifts_user_open ON public.position_drifts (user_id, resolved, created_at DESC);

GRANT SELECT, UPDATE ON public.position_drifts TO authenticated;
GRANT ALL ON public.position_drifts TO service_role;
ALTER TABLE public.position_drifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drifts"
ON public.position_drifts FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can resolve their own drifts"
ON public.position_drifts FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_position_drifts_updated_at
BEFORE UPDATE ON public.position_drifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic single-flight lock acquisition: returns a row only when the lock is won.
CREATE OR REPLACE FUNCTION public.acquire_worker_lock(_job_name TEXT, _lease_seconds INTEGER)
RETURNS TABLE(acquired BOOLEAN, lock_token UUID, status TEXT, pause_reason TEXT, last_cursor TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token UUID := gen_random_uuid();
  _row public.worker_jobs%ROWTYPE;
BEGIN
  INSERT INTO public.worker_jobs (job_name) VALUES (_job_name)
  ON CONFLICT (job_name) DO NOTHING;

  SELECT * INTO _row FROM public.worker_jobs WHERE job_name = _job_name FOR UPDATE;

  IF _row.status = 'paused' THEN
    RETURN QUERY SELECT false, NULL::uuid, _row.status, _row.pause_reason, _row.last_cursor;
    RETURN;
  END IF;

  IF _row.locked_until IS NOT NULL AND _row.locked_until > now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 'locked'::text, NULL::text, _row.last_cursor;
    RETURN;
  END IF;

  UPDATE public.worker_jobs
  SET status = 'running',
      lock_token = _token,
      locked_until = now() + make_interval(secs => _lease_seconds),
      last_run_at = now()
  WHERE job_name = _job_name;

  RETURN QUERY SELECT true, _token, 'running'::text, NULL::text, _row.last_cursor;
END;
$$;

-- Release the lock only if this run still holds it.
CREATE OR REPLACE FUNCTION public.release_worker_lock(
  _job_name TEXT,
  _lock_token UUID,
  _status TEXT,
  _cursor TEXT,
  _error TEXT,
  _stats JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated INTEGER;
BEGIN
  UPDATE public.worker_jobs
  SET status = _status,
      locked_until = NULL,
      lock_token = NULL,
      last_cursor = COALESCE(_cursor, last_cursor),
      last_error = _error,
      stats = COALESCE(_stats, stats),
      last_success_at = CASE WHEN _error IS NULL THEN now() ELSE last_success_at END,
      consecutive_failures = CASE WHEN _error IS NULL THEN 0 ELSE consecutive_failures + 1 END
  WHERE job_name = _job_name AND lock_token = _lock_token;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;