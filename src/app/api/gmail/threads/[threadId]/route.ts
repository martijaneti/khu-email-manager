import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailAccessToken, fetchThreadFull, parseFullThread } from "@/lib/gmail";

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
      return NextResponse.json({ error: "no_gmail_token" }, { status: 403 });
    }

    const accessToken = await getGmailAccessToken(tokenRow.refresh_token);
    const rawThread = await fetchThreadFull(accessToken, threadId);
    const thread = parseFullThread(rawThread);

    return NextResponse.json({ thread });
  } catch (err) {
    console.error(`[/api/gmail/threads/${threadId}] error:`, err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}
