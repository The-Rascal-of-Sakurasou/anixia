-- Edge Function invocations have a short execution ceiling. A run record
-- left in "running" for more than ten minutes is stale, not an active sync.
UPDATE public.catalog_sync_runs
SET status = 'failed',
    finished_at = COALESCE(finished_at, now()),
    error_message = COALESCE(
      NULLIF(error_message, ''),
      'Automatically marked failed: no completion was recorded within 10 minutes. Check the corresponding Edge Function logs.'
    )
WHERE status = 'running'
  AND started_at < now() - interval '10 minutes';

-- Keep the audit table truthful when a later Edge Function invocation is
-- terminated before it can write its final status.
SELECT cron.schedule(
  'anixia-stale-sync-run-cleanup',
  '*/30 * * * *',
  $job$
  UPDATE public.catalog_sync_runs
  SET status = 'failed',
      finished_at = COALESCE(finished_at, now()),
      error_message = COALESCE(
        NULLIF(error_message, ''),
        'Automatically marked failed: no completion was recorded within 10 minutes. Check the corresponding Edge Function logs.'
      )
  WHERE status = 'running'
    AND started_at < now() - interval '10 minutes';
  $job$
);
