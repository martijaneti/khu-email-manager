import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/inbox";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      // Persist the Google refresh token so server-side API routes can call
      // the Gmail API without exposing any token to the browser.
      const refreshToken = data.session.provider_refresh_token;
      if (refreshToken && data.user) {
        const scopes = (data.session.provider_token ?? "")
          .split(" ")
          .filter(Boolean);

        const { error: upsertError } = await supabase
          .from("gmail_tokens")
          .upsert(
            {
              user_id: data.user.id,
              refresh_token: refreshToken,
              granted_scopes: scopes,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          console.error("Failed to save Gmail refresh token:", upsertError.message);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Code exchange error:", exchangeError?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
