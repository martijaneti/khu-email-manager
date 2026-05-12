-- Add replies column to email_summaries for caching AI-generated tone drafts
alter table email_summaries
  add column if not exists replies jsonb;
