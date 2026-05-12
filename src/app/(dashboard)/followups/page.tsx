"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useInboxContext } from "@/context/InboxContext";

interface Followup {
  id: string;
  subject: string;
  to: string;
  toName: string;
  triggerAfterDays: number;
  sentAt: Date;
  status: "watching" | "triggered" | "cancelled";
  threadId: string;
}

const INITIAL_FOLLOWUPS: Followup[] = [
  {
    id: "f1",
    subject: "Coffee chat this week?",
    to: "marco@startup.io",
    toName: "Marco Rivera",
    triggerAfterDays: 3,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
    status: "watching",
    threadId: "t5",
  },
  {
    id: "f2",
    subject: "Q2 Partnership Proposal — Follow-up needed",
    to: "sarah@acmecorp.com",
    toName: "Sarah Chen",
    triggerAfterDays: 5,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "watching",
    threadId: "t1",
  },
];

export default function FollowupsPage() {
  const toast = useToast();
  const { setFollowupCount } = useInboxContext();
  const [followups, setFollowups] = useState<Followup[]>(INITIAL_FOLLOWUPS);
  const cancelTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const watching = followups.filter((f) => f.status === "watching");

  useEffect(() => {
    setFollowupCount(watching.length);
    return () => setFollowupCount(0);
  }, [watching.length, setFollowupCount]);

  function cancelFollowup(id: string) {
    const item = followups.find((f) => f.id === id);
    if (!item) return;

    setFollowups((prev) => prev.filter((f) => f.id !== id));

    const timer = setTimeout(() => {
      cancelTimers.current.delete(id);
    }, 8000);
    cancelTimers.current.set(id, timer);

    toast.show("Follow-up cancelled", "info", {
      label: "Undo",
      onClick: () => {
        const t = cancelTimers.current.get(id);
        if (t) { clearTimeout(t); cancelTimers.current.delete(id); }
        setFollowups((prev) => {
          if (prev.find((f) => f.id === id)) return prev;
          return [...prev, item];
        });
        toast.show("Follow-up restored", "success");
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-sm">Follow-ups</h1>
        <p className="text-xs text-gray-400">
          {watching.length > 0
            ? `${watching.length} active — auto-send if no reply`
            : "No active follow-ups"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {watching.map((f) => {
          const triggerAt = new Date(f.sentAt.getTime() + f.triggerAfterDays * 86400000);
          const totalMs = f.triggerAfterDays * 86400000;
          const elapsed = Math.max(0, Date.now() - f.sentAt.getTime());
          const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
          const hoursLeft = Math.max(0, Math.round((triggerAt.getTime() - Date.now()) / 3600000));
          const daysLeft = Math.floor(hoursLeft / 24);

          const timeLabel =
            hoursLeft === 0
              ? "Sending soon…"
              : daysLeft > 0
              ? `~${daysLeft}d left`
              : `~${hoursLeft}h left`;

          return (
            <div key={f.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      Watching
                    </span>
                    <span className="text-xs text-gray-400">{timeLabel}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{f.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    To: {f.toName} &lt;{f.to}&gt;
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Will send if no reply within {f.triggerAfterDays} day{f.triggerAfterDays > 1 ? "s" : ""} of original email
                  </p>
                </div>
                <button
                  onClick={() => cancelFollowup(f.id)}
                  className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 transition-colors mt-1 font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-300">Sent</span>
                <span className="text-[10px] text-gray-300">Follow-up sends</span>
              </div>
            </div>
          );
        })}

        {watching.length === 0 && (
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
