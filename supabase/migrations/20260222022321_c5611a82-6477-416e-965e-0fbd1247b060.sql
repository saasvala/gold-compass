
-- Trade history table
CREATE TABLE public.trade_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  sl_price NUMERIC NOT NULL,
  tp_price NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL,
  risk_percent NUMERIC,
  rr_ratio NUMERIC,
  risk_usd NUMERIC,
  reward_usd NUMERIC,
  status TEXT NOT NULL DEFAULT 'filled' CHECK (status IN ('filled', 'failed', 'cancelled')),
  profit_usd NUMERIC,
  trading_mode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.trade_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trade_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for demo mode (no auth required)
CREATE POLICY "Allow anonymous trade inserts"
  ON public.trade_history FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous trade reads"
  ON public.trade_history FOR SELECT
  USING (user_id IS NULL);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  active_mode TEXT NOT NULL DEFAULT 'institutional',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow anonymous access for demo
CREATE POLICY "Allow anonymous preferences"
  ON public.user_preferences FOR ALL
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Notification log table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow anonymous notifications"
  ON public.notifications FOR ALL
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
