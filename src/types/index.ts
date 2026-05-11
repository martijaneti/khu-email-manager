export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface GmailToken {
  id: string;
  user_id: string;
  refresh_token: string;
  granted_scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface EmailSummary {
  id: string;
  user_id: string;
  thread_id: string;
  summary: string;
  model: string;
  tokens_used: number | null;
  created_at: string;
}

export interface ScheduledReply {
  id: string;
  user_id: string;
  thread_id: string;
  draft_body: string;
  send_at: string;
  sent_at: string | null;
  idempotency_key: string;
  created_at: string;
}
