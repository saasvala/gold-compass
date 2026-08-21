-- Worker lock helpers are service-role only; no client should be able to grab or release the lock.
REVOKE EXECUTE ON FUNCTION public.acquire_worker_lock(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_worker_lock(TEXT, UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_worker_lock(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_worker_lock(TEXT, UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;