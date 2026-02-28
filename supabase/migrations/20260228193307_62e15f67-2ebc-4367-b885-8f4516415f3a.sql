
-- Signal analysis logs for Smart Accuracy Engine
CREATE TABLE public.signal_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES public.bot_configs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Multi-layer confirmation
  trend_score NUMERIC DEFAULT 0,
  momentum_score NUMERIC DEFAULT 0,
  volatility_score NUMERIC DEFAULT 0,
  volume_score NUMERIC DEFAULT 0,
  ai_confidence NUMERIC DEFAULT 0,
  overall_confidence NUMERIC DEFAULT 0,
  
  -- Trade details
  direction TEXT,
  entry_reason TEXT,
  expected_value NUMERIC DEFAULT 0,
  rr_ratio NUMERIC DEFAULT 0,
  
  -- Execution quality
  execution_quality NUMERIC DEFAULT 0,
  slippage_pips NUMERIC DEFAULT 0,
  spread_at_entry NUMERIC DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  fill_type TEXT DEFAULT 'full',
  
  -- Result
  executed BOOLEAN DEFAULT false,
  rejected_reason TEXT
);

ALTER TABLE public.signal_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signals" ON public.signal_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signals" ON public.signal_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all signals" ON public.signal_analysis
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Audit logs for Security Hardening
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info'
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for signal_analysis
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_analysis;
