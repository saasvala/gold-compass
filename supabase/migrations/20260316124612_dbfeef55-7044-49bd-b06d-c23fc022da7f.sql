
-- Market data table for ticks and candles
CREATE TABLE public.market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  exchange text NOT NULL DEFAULT 'binance',
  data_type text NOT NULL DEFAULT 'candle', -- tick, candle
  timeframe text DEFAULT '1m',
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume numeric DEFAULT 0,
  bid numeric,
  ask numeric,
  spread numeric,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_market_data_symbol_ts ON public.market_data (symbol, timestamp DESC);
CREATE INDEX idx_market_data_exchange ON public.market_data (exchange, symbol);

-- Enable RLS
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Market data is readable by all authenticated users
CREATE POLICY "Authenticated users can read market data"
  ON public.market_data FOR SELECT TO authenticated
  USING (true);

-- Only service role can insert (edge functions)
CREATE POLICY "Service role inserts market data"
  ON public.market_data FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Rate limiting table
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits (user_id, endpoint, window_start DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rate limits"
  ON public.rate_limits FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for market_data
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_data;
