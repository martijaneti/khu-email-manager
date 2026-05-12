-- Add unique constraint on gmail_tokens.user_id so upserts work correctly.
-- One row per user is the correct cardinality; any extra rows from early
-- development can be collapsed by keeping the most recently updated one.

-- Deduplicate: keep only the latest row per user before adding the constraint.
delete from gmail_tokens
where id not in (
  select id from (
    select distinct on (user_id) id
    from gmail_tokens
    order by user_id, updated_at desc nulls last, created_at desc
  ) as latest
);

alter table gmail_tokens
  add constraint gmail_tokens_user_id_key unique (user_id);
