DO $anixia$
BEGIN
  -- 200 UUIDs fit safely in the PostgREST filter URL; larger batches can
  -- exceed request-target limits before the title-matching work begins.
  PERFORM cron.schedule(
    'anixia-syoboi-title-sync',
    '*/30 * * * *',
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
        body := jsonb_build_object('mode', 'sync', 'limit', 200),
        timeout_milliseconds := 120000
      );
    END
    $sync$;
    $job$
  );
END
$anixia$;
