// Server-side only — never import from client components
import type { EmailThread, EmailMessage } from "@/lib/mock-data";

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailPart {
  mimeType: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { size: number; data?: string; attachmentId?: string };
  parts?: GmailPart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    body?: { size: number; data?: string };
    parts?: GmailPart[];
    mimeType?: string;
  };
}

export interface GmailThread {
  id: string;
  snippet?: string;
  historyId?: string;
  messages?: GmailMessage[];
}

export interface GmailThreadListItem {
  id: string;
  snippet?: string;
  historyId?: string;
}

function getHeader(headers: GmailHeader[], name: string): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function decodeBase64Url(encoded: string): string {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractBodyFromParts(parts: GmailPart[], mimeType: string): string {
  for (const part of parts) {
    if (part.mimeType === mimeType && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      const nested = extractBodyFromParts(part.parts, mimeType);
      if (nested) return nested;
    }
  }
  return "";
}

function extractBody(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return message.snippet ?? "";

  if (payload.body?.data && !payload.parts?.length) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    const plain = extractBodyFromParts(payload.parts, "text/plain");
    if (plain) return plain;
    const html = extractBodyFromParts(payload.parts, "text/html");
    if (html) return html;
  }

  return message.snippet ?? "";
}

function extractAttachments(
  parts?: GmailPart[]
): { name: string; size: string; type: string }[] {
  if (!parts) return [];
  const result: { name: string; size: string; type: string }[] = [];
  for (const part of parts) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      const ext = part.filename.split(".").pop()?.toLowerCase() ?? "file";
      const sizeKb = Math.round((part.body.size ?? 0) / 1024);
      const size =
        sizeKb > 1024
          ? `${(sizeKb / 1024).toFixed(1)} MB`
          : `${sizeKb} KB`;
      result.push({ name: part.filename, size, type: ext });
    }
    if (part.parts) result.push(...extractAttachments(part.parts));
  }
  return result;
}

function parseFrom(fromHeader: string): { name: string; email: string } {
  const match = fromHeader.match(/^"?([^"<]+?)"?\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: fromHeader, email: fromHeader };
}

const SYSTEM_LABELS = new Set([
  "INBOX", "SENT", "TRASH", "SPAM", "DRAFT", "UNREAD", "STARRED",
  "IMPORTANT", "CATEGORY_PERSONAL", "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS", "CATEGORY_UPDATES", "CATEGORY_FORUMS", "CHAT",
]);

function mapGmailLabels(labelIds: string[]): string[] {
  const labels: string[] = [];
  if (labelIds.includes("IMPORTANT")) labels.push("important");
  for (const id of labelIds) {
    if (!SYSTEM_LABELS.has(id)) labels.push(id.toLowerCase());
  }
  return labels;
}

export function parseThreadSummary(thread: GmailThread): EmailThread {
  const messages = thread.messages ?? [];
  const lastMsg = messages[messages.length - 1];
  const allLabelIds = messages.flatMap((m) => m.labelIds ?? []);

  const headers = lastMsg?.payload?.headers ?? [];
  const fromHeader = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateStr = getHeader(headers, "Date");
  const date = dateStr
    ? new Date(dateStr)
    : new Date(Number(lastMsg?.internalDate ?? Date.now()));

  const { name: fromName, email: fromEmail } = parseFrom(fromHeader);

  const participants = [
    ...new Set(
      messages.flatMap((m) => {
        const h = m.payload?.headers ?? [];
        const { email } = parseFrom(getHeader(h, "From"));
        return [email];
      })
    ),
  ];

  const unread = allLabelIds.includes("UNREAD");
  const starred = allLabelIds.includes("STARRED");
  const hasAttachments = messages.some((m) =>
    (m.payload?.parts ?? []).some(
      (p) => p.filename && p.filename.length > 0
    )
  );

  // Build a placeholder single message so the thread view has something to render
  const placeholderMessage: EmailMessage = {
    id: lastMsg?.id ?? thread.id,
    from: fromName || fromEmail,
    fromEmail,
    to: [],
    date,
    body: thread.snippet ?? "",
  };

  return {
    id: thread.id,
    subject,
    participants,
    lastMessage: {
      from: fromName || fromEmail,
      fromEmail,
      preview: thread.snippet ?? "",
      body: thread.snippet ?? "",
      date,
    },
    messages: [placeholderMessage],
    unread,
    starred,
    labels: mapGmailLabels([...new Set(allLabelIds)]),
    hasAttachments,
  };
}

export function parseFullThread(thread: GmailThread): EmailThread {
  const summary = parseThreadSummary(thread);
  const messages: EmailMessage[] = (thread.messages ?? []).map((msg) => {
    const headers = msg.payload?.headers ?? [];
    const fromHeader = getHeader(headers, "From");
    const dateStr = getHeader(headers, "Date");
    const toHeader = getHeader(headers, "To");
    const date = dateStr
      ? new Date(dateStr)
      : new Date(Number(msg.internalDate ?? Date.now()));
    const { name: fromName, email: fromEmail } = parseFrom(fromHeader);
    const body = extractBody(msg);
    const attachments = extractAttachments(msg.payload?.parts);

    return {
      id: msg.id,
      from: fromName || fromEmail,
      fromEmail,
      to: toHeader
        ? toHeader.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      date,
      body,
      ...(attachments.length > 0 ? { attachments } : {}),
    };
  });

  const lastMessage = messages[messages.length - 1];

  return {
    ...summary,
    messages,
    lastMessage: {
      ...summary.lastMessage,
      body: lastMessage?.body ?? summary.lastMessage.body,
    },
  };
}

// ─── Google OAuth token refresh ─────────────────────────────────────────────

export async function getGmailAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token in token response");
  return data.access_token;
}

// ─── Gmail API calls ─────────────────────────────────────────────────────────

export async function fetchThreadList(
  accessToken: string,
  maxResults = 50
): Promise<GmailThreadListItem[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&labelIds=INBOX`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`threads.list failed: ${res.status}`);
  const data = (await res.json()) as { threads?: GmailThreadListItem[] };
  return data.threads ?? [];
}

export async function fetchThreadMetadata(
  accessToken: string,
  threadId: string
): Promise<GmailThread> {
  const url =
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}` +
    `?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`threads.get metadata failed: ${res.status} (${threadId})`);
  return res.json() as Promise<GmailThread>;
}

export async function fetchThreadFull(
  accessToken: string,
  threadId: string
): Promise<GmailThread> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`threads.get full failed: ${res.status} (${threadId})`);
  return res.json() as Promise<GmailThread>;
}
