
-- Trade journal entries
CREATE TABLE public.trade_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES public.trade_history(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  sl_price NUMERIC NOT NULL,
  tp_price NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL DEFAULT 0.1,
  rr_ratio NUMERIC,
  profit_usd NUMERIC,
  result TEXT CHECK (result IN ('win', 'loss', 'breakeven', 'open')),
  trading_mode TEXT NOT NULL,
  setup_type TEXT,
  emotion TEXT CHECK (emotion IN ('confident', 'neutral', 'fearful', 'greedy', 'revenge', 'disciplined')),
  notes TEXT,
  mistakes TEXT,
  lessons TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal" ON public.trade_journal
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal" ON public.trade_journal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal" ON public.trade_journal
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal" ON public.trade_journal
  FOR DELETE USING (auth.uid() = user_id);
