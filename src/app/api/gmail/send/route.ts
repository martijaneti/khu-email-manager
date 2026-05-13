import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailAccessToken, fetchThreadFull } from "@/lib/gmail";

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

function buildRfc2822(opts: {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines: string[] = [];
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  if (opts.cc) lines.push(`CC: ${opts.cc}`);
  if (opts.bcc) lines.push(`BCC: ${opts.bcc}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("MIME-Version: 1.0");
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(opts.body);
  return lines.join("\r\n");
}

function toBase64Url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(request: Request) {
  if (DEMO_MODE) {
    // Simulate success in demo mode so UI flow is testable
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ messageId: "demo-" + Date.now() });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenRow?.refresh_token) {
      return NextResponse.json(
        { error: "no_gmail_token", message: "Please reconnect your Gmail account." },
        { status: 403 }
      );
    }

    const accessToken = await getGmailAccessToken(tokenRow.refresh_token);

    const body = await request.json() as {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      cc?: string;
      bcc?: string;
    };

    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Derive sender email from the authenticated user
    const fromEmail = user.email ?? "";

    // If replying to a thread, fetch the last message's Message-ID header for proper threading
    let inReplyTo: string | undefined;
    let references: string | undefined;
    if (body.threadId) {
      try {
        const thread = await fetchThreadFull(accessToken, body.threadId);
        const msgs = thread.messages ?? [];
        const last = msgs[msgs.length - 1];
        if (last) {
          const headers = last.payload?.headers ?? [];
          const msgId = headers.find(
            (h) => h.name.toLowerCase() === "message-id"
          )?.value;
          if (msgId) {
            inReplyTo = msgId;
            // Collect all Message-IDs in thread for References header
            const allMsgIds = msgs
              .map((m) =>
                (m.payload?.headers ?? []).find(
                  (h) => h.name.toLowerCase() === "message-id"
                )?.value
              )
              .filter(Boolean) as string[];
            if (allMsgIds.length > 0) references = allMsgIds.join(" ");
          }
        }
      } catch {
        // Non-critical — still send without threading headers
      }
    }

    const subject = body.threadId
      ? body.subject.startsWith("Re:") || body.subject.startsWith("re:")
        ? body.subject
        : `Re: ${body.subject}`
      : body.subject;

    const raw = buildRfc2822({
      from: fromEmail,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject,
      body: body.body,
      inReplyTo,
      references,
    });

    const encodedRaw = toBase64Url(raw);

    const sendBody: Record<string, string> = { raw: encodedRaw };
    if (body.threadId) sendBody.threadId = body.threadId;

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendBody),
        cache: "no-store",
      }
    );

    if (!gmailRes.ok) {
      const errBody = await gmailRes.text();
      console.error("[/api/gmail/send] Gmail API error:", gmailRes.status, errBody);
      return NextResponse.json(
        { error: "send_failed", message: `Gmail API: ${gmailRes.status}` },
        { status: 502 }
      );
    }

    const result = (await gmailRes.json()) as { id?: string; threadId?: string };
    return NextResponse.json({ messageId: result.id, threadId: result.threadId });
  } catch (err) {
    console.error("[/api/gmail/send] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}
