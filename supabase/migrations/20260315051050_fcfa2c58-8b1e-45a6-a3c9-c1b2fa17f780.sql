
-- ============================================================
-- STRATEGIES TABLE
-- ============================================================
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES public.bot_configs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL DEFAULT 'custom',
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  entry_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  exit_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  timeframe TEXT NOT NULL DEFAULT '1h',
  symbols TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  backtest_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strategies" ON public.strategies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all strategies" ON public.strategies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- BROKER CONNECTIONS TABLE
-- ============================================================
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  broker_type TEXT NOT NULL DEFAULT 'exchange',
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  passphrase_encrypted TEXT,
  is_testnet BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  last_connected_at TIMESTAMPTZ,
  connection_status TEXT NOT NULL DEFAULT 'disconnected',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own broker connections" ON public.broker_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TYPE public.order_status AS ENUM ('pending', 'submitted', 'partial_fill', 'filled', 'cancelled', 'rejected', 'expired');
CREATE TYPE public.order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop');
CREATE TYPE public.order_side AS ENUM ('buy', 'sell');

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES public.bot_configs(id) ON DELETE SET NULL,
  broker_connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  side order_side NOT NULL,
  order_type order_type NOT NULL DEFAULT 'market',
  status order_status NOT NULL DEFAULT 'pending',
  quantity NUMERIC NOT NULL,
  price NUMERIC,
  stop_price NUMERIC,
  trail_percent NUMERIC,
  filled_quantity NUMERIC NOT NULL DEFAULT 0,
  avg_fill_price NUMERIC,
  commission NUMERIC DEFAULT 0,
  broker_order_id TEXT,
  time_in_force TEXT NOT NULL DEFAULT 'GTC',
  submitted_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- POSITIONS TABLE
-- ============================================================
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES public.bot_configs(id) ON DELETE SET NULL,
  broker_connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  side order_side NOT NULL,
  quantity NUMERIC NOT NULL,
  avg_entry_price NUMERIC NOT NULL,
  current_price NUMERIC,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  liquidation_price NUMERIC,
  leverage NUMERIC DEFAULT 1,
  margin_used NUMERIC DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions" ON public.positions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all positions" ON public.positions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- PORTFOLIO SNAPSHOTS TABLE
-- ============================================================
CREATE TABLE public.portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_equity NUMERIC NOT NULL DEFAULT 0,
  total_balance NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  total_margin_used NUMERIC DEFAULT 0,
  drawdown_percent NUMERIC DEFAULT 0,
  max_drawdown_percent NUMERIC DEFAULT 0,
  exposure_by_asset JSONB DEFAULT '{}'::jsonb,
  open_positions_count INTEGER DEFAULT 0,
  snapshot_type TEXT NOT NULL DEFAULT 'hourly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own snapshots" ON public.portfolio_snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RISK EVENTS TABLE
-- ============================================================
CREATE TABLE public.risk_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID REFERENCES public.bot_configs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  description TEXT NOT NULL,
  trigger_value NUMERIC,
  threshold_value NUMERIC,
  action_taken TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own risk events" ON public.risk_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all risk events" ON public.risk_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_events;
