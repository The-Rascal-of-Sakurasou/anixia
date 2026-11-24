-- Resume incremental episode metadata collection at a conservative cadence.
-- The importer processes up to 30 published Wikidata works per invocation,
-- with sequential requests and a delay between Wikidata queries.
DO $anixia$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'anixia-wikidata-episodes-sync') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'anixia-wikidata-episodes-sync'),
      schedule := '*/10 * * * *',
      active := true
    );
  ELSE
    PERFORM cron.schedule(
      'anixia-wikidata-episodes-sync',
      '*/10 * * * *',
      $job$
        SELECT net.http_post(
          url := 'https://trvnxggqzlhqdhoyiliy.supabase.co/functions/v1/sync-wikidata-episodes',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-anixia-cron-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anixia_wikidata_sync_token' LIMIT 1)
          ),
          body := jsonb_build_object('mode', 'sync', 'limit', 30),
          timeout_milliseconds := 120000
        );
      $job$
    );
  END IF;
END
$anixia$;
