import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getGmailAccessToken,
  fetchThreadList,
  fetchThreadMetadata,
  parseThreadSummary,
} from "@/lib/gmail";

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "demo_mode", threads: [] },
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

    // Fetch up to 50 thread IDs
    const threadItems = await fetchThreadList(accessToken, 50);

    // Batch-fetch thread metadata in groups of 15 to avoid hammering rate limits
    const BATCH = 15;
    const threads = [];
    for (let i = 0; i < threadItems.length; i += BATCH) {
      const batch = threadItems.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((item) =>
          fetchThreadMetadata(accessToken, item.id)
            .then((t) => {
              // threads.list snippet is often better-formatted than per-thread snippet
              if (item.snippet) t.snippet = item.snippet;
              return parseThreadSummary(t);
            })
            .catch(() => null)
        )
      );
      threads.push(...results.filter(Boolean));
    }

    return NextResponse.json({ threads });
  } catch (err) {
    console.error("[/api/gmail/threads] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}
