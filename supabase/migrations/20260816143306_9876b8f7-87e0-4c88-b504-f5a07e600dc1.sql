CREATE TABLE public.risk_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  max_risk_per_trade_percent numeric NOT NULL DEFAULT 1,
  max_daily_loss_percent numeric NOT NULL DEFAULT 3,
  max_total_drawdown_percent numeric NOT NULL DEFAULT 10,
  max_open_positions integer NOT NULL DEFAULT 10,
  max_pending_orders integer NOT NULL DEFAULT 20,
  max_exposure_per_symbol_percent numeric NOT NULL DEFAULT 20,
  max_leverage numeric NOT NULL DEFAULT 10,
  account_balance numeric NOT NULL DEFAULT 10000,
  kill_switch_enabled boolean NOT NULL DEFAULT false,
  trading_paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_limits TO authenticated;
GRANT ALL ON public.risk_limits TO service_role;

ALTER TABLE public.risk_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own risk limits"
ON public.risk_limits FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all risk limits"
ON public.risk_limits FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_risk_limits_updated_at
BEFORE UPDATE ON public.risk_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user_risk_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.risk_limits (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_risk_limits
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_risk_limits();

INSERT INTO public.risk_limits (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;