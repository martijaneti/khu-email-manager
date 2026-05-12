import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getGmailAccessToken,
  fetchThreadFull,
  parseFullThread,
} from "@/lib/gmail";
import { generateEmailAI, AIReplies } from "@/lib/claude";

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  if (DEMO_MODE) {
    return NextResponse.json({ error: "demo_mode" }, { status: 503 });
  }

  if (!threadId) {
    return NextResponse.json({ error: "missing_thread_id" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY not set." },
      { status: 503 }
    );
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

    // Check Supabase cache first
    const { data: cached } = await supabase
      .from("email_summaries")
      .select("summary, replies")
      .eq("user_id", user.id)
      .eq("thread_id", threadId)
      .single();

    if (cached?.summary && cached?.replies) {
      return NextResponse.json({
        summary: cached.summary,
        replies: cached.replies as AIReplies,
        cached: true,
      });
    }

    // Cache miss — fetch Gmail thread and call Claude
    const { data: tokenRow, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenRow?.refresh_token) {
      return NextResponse.json({ error: "no_gmail_token" }, { status: 403 });
    }

    const accessToken = await getGmailAccessToken(tokenRow.refresh_token);
    const rawThread = await fetchThreadFull(accessToken, threadId);
    const thread = parseFullThread(rawThread);

    const messages = thread.messages.map((m) => ({
      from: m.from,
      date: m.date.toISOString(),
      body: m.body,
    }));

    const aiContent = await generateEmailAI(thread.subject, messages);

    // Upsert into cache
    await supabase.from("email_summaries").upsert(
      {
        user_id: user.id,
        thread_id: threadId,
        summary: aiContent.summary,
        replies: aiContent.replies,
        model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
      },
      { onConflict: "user_id,thread_id" }
    );

    return NextResponse.json({
      summary: aiContent.summary,
      replies: aiContent.replies,
      cached: false,
    });
  } catch (err) {
    console.error(`[/api/ai/${threadId}] error:`, err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}
