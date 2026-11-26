DO $anixia$
DECLARE
  existing_job record;
BEGIN
  -- Retire runs that were left open when the whole-catalog invocation timed out.
  UPDATE public.catalog_sync_runs
  SET status = 'failed',
      finished_at = now(),
      error_message = 'Superseded by paginated Syoboi title synchronization after the full-catalog invocation exceeded its execution window.'
  WHERE source = 'syoboi-titles'
    AND status = 'running'
    AND started_at < now() - interval '10 minutes';

  -- Restart the cursor. The new sync is idempotent and preserves existing
  -- identifiers/readings, so previously completed rows remain safe to revisit.
  INSERT INTO public.catalog_sync_state (source, next_offset, last_success_at, updated_at)
  VALUES ('syoboi-titles', 0, NULL, now())
  ON CONFLICT (source) DO UPDATE
    SET next_offset = 0,
        last_success_at = NULL,
        updated_at = now();

  FOR existing_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'anixia-syoboi-title-sync'
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;

  -- One bounded 1,000-record batch per hour. The cursor advances only after
  -- the batch and its audit record have completed successfully. Once a full
  -- pass finishes, the job idles until the next UTC day.
  PERFORM cron.schedule(
    'anixia-syoboi-title-sync',
    '0 * * * *',
    $job$
    DO $sync$
    DECLARE
      next_page integer;
      last_success timestamptz;
    BEGIN
      SELECT next_offset, last_success_at
        INTO next_page, last_success
      FROM public.catalog_sync_state
      WHERE source = 'syoboi-titles';

      IF COALESCE(next_page, 0) = 0
         AND last_success >= date_trunc('day', now()) THEN
        RETURN;
      END IF;

      PERFORM net.http_post(
        url := 'https://trvnxggqzlhqdhoyiliy.supabase.co/functions/v1/sync-syoboi-titles',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-anixia-cron-token',
          (SELECT decrypted_secret
           FROM vault.decrypted_secrets
           WHERE name = 'anixia_wikidata_sync_token'
           LIMIT 1)
        ),
        body := jsonb_build_object('mode', 'sync', 'limit', 1000),
        timeout_milliseconds := 120000
      );
    END
    $sync$;
    $job$
  );
END
$anixia$;
