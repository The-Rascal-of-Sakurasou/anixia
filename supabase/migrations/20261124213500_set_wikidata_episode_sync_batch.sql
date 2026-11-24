-- Keep the episode importer at the same 30-work batch size as the
-- 10-minute schedule. Each work is queried sequentially with a delay.
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='anixia-wikidata-episodes-sync'),
  schedule := '*/10 * * * *',
  command := $job$
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
