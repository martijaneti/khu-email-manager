import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✉️</span>
          <h1 className="text-lg font-semibold text-gray-900">KHU Mail</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Gmail integration coming soon
          </h2>
          <p className="text-gray-600">
            You&apos;re signed in as <strong>{user.email}</strong>. Gmail fetch
            and AI summarization will be wired up in Milestone 2.
          </p>
        </div>
      </main>
    </div>
  );
}
