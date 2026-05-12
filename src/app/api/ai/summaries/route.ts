import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// GET /api/ai/summaries?threadIds=id1,id2,...
// Returns cached summaries from Supabase for the given thread IDs.
export async function GET(req: NextRequest) {
  if (DEMO_MODE) {
    return NextResponse.json({ summaries: {} });
  }

  const raw = req.nextUrl.searchParams.get("threadIds") ?? "";
  const threadIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100); // hard cap

  if (threadIds.length === 0) {
    return NextResponse.json({ summaries: {} });
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

    const { data: rows } = await supabase
      .from("email_summaries")
      .select("thread_id, summary")
      .eq("user_id", user.id)
      .in("thread_id", threadIds);

    const summaries: Record<string, string> = {};
    for (const row of rows ?? []) {
      summaries[row.thread_id] = row.summary;
    }

    return NextResponse.json({ summaries });
  } catch (err) {
    console.error("[/api/ai/summaries] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}
