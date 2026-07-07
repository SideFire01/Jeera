-- Enable the pg_cron extension
-- Note: You might need to enable this in your Supabase Dashboard -> Database -> Extensions
create extension if not exists pg_cron;

-- Schedule a job to delete activities older than 365 days
-- This runs every day at 3:00 AM (UTC)
select cron.schedule(
  'delete-old-activities', -- Unique name for the job
  '0 3 * * *',             -- Cron syntax: At minute 0 past hour 3
  $$
    delete from public.activities 
    where created_at < now() - interval '365 days';
  $$
);

-- To view scheduled jobs:
-- select * from cron.job;

-- To un-schedule:
-- select cron.unschedule('delete-old-activities');
