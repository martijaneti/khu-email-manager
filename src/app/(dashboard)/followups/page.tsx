"use client";

import { MOCK_THREADS } from "@/lib/mock-data";

const MOCK_FOLLOWUPS = [
  {
    id: "f1",
    subject: "Coffee chat this week?",
    to: "marco@startup.io",
    toName: "Marco Rivera",
    triggerAfterDays: 3,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
    status: "watching" as const,
    threadId: "t5",
  },
];

export default function FollowupsPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-sm">Follow-ups</h1>
        <p className="text-xs text-gray-400">Auto-send if no reply</p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {MOCK_FOLLOWUPS.map((f) => {
          const triggerAt = new Date(f.sentAt.getTime() + f.triggerAfterDays * 86400000);
          const hoursLeft = Math.max(0, Math.round((triggerAt.getTime() - Date.now()) / 3600000));

          return (
            <div key={f.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      Watching
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{f.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">To: {f.toName} &lt;{f.to}&gt;</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Will send follow-up in ~{hoursLeft}h if no reply
                  </p>
                </div>
                <button className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 transition-colors mt-1">
                  Cancel
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, 100 - (hoursLeft / (f.triggerAfterDays * 24)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {MOCK_FOLLOWUPS.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 text-sm">No active follow-ups</p>
            <p className="text-gray-400 text-xs mt-1">
              Enable auto follow-up when replying to an email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
