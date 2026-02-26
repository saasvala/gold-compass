
CREATE OR REPLACE FUNCTION public.get_bot_leaderboard()
RETURNS TABLE(
  bot_type text,
  bot_category text,
  total_users bigint,
  avg_pnl numeric,
  avg_win_rate numeric,
  total_pnl numeric,
  best_pnl numeric,
  avg_trades numeric,
  sharpe_ratio numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    bc.bot_type,
    bc.bot_category,
    COUNT(DISTINCT bc.user_id) AS total_users,
    ROUND(AVG(bc.pnl_total), 2) AS avg_pnl,
    ROUND(AVG(bc.win_rate), 1) AS avg_win_rate,
    ROUND(SUM(bc.pnl_total), 2) AS total_pnl,
    ROUND(MAX(bc.pnl_total), 2) AS best_pnl,
    ROUND(AVG(bc.total_trades), 0) AS avg_trades,
    CASE
      WHEN STDDEV(bc.pnl_total) > 0 THEN ROUND(AVG(bc.pnl_total) / STDDEV(bc.pnl_total), 2)
      ELSE 0
    END AS sharpe_ratio
  FROM bot_configs bc
  WHERE bc.total_trades > 0
  GROUP BY bc.bot_type, bc.bot_category
  ORDER BY sharpe_ratio DESC
$$;
