"use client";

import { useEffect, useRef, useState } from "react";
import { MOCK_SCHEDULED, ScheduledEmail, formatScheduledTime } from "@/lib/mock-data";
import { useToast } from "@/context/ToastContext";
import { useInboxContext } from "@/context/InboxContext";
import { ComposeModal } from "@/components/compose/ComposeModal";

export default function ScheduledPage() {
  const toast = useToast();
  const { setScheduledCount } = useInboxContext();
  const [items, setItems] = useState<ScheduledEmail[]>(MOCK_SCHEDULED);

  useEffect(() => {
    setScheduledCount(items.length);
    return () => setScheduledCount(0);
  }, [items.length, setScheduledCount]);
  const [editItem, setEditItem] = useState<ScheduledEmail | null>(null);
  const cancelTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function cancelItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) => prev.filter((i) => i.id !== id));

    const timer = setTimeout(() => {
      cancelTimers.current.delete(id);
    }, 8000);
    cancelTimers.current.set(id, timer);

    toast.show("Scheduled email cancelled", "info", {
      label: "Undo",
      onClick: () => {
        const t = cancelTimers.current.get(id);
        if (t) { clearTimeout(t); cancelTimers.current.delete(id); }
        setItems((prev) => {
          if (prev.find((i) => i.id === id)) return prev;
          return [...prev, item].sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
        });
        toast.show("Restored", "success");
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-sm">Scheduled</h1>
        <p className="text-xs text-gray-400">
          {items.length > 0 ? `${items.length} queued` : "Nothing scheduled"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.kind === "followup"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.kind === "followup" ? "Follow-up" : "Scheduled reply"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{item.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5">To: {item.to}</p>
                <p className="text-xs text-gray-400 mt-1 truncate italic">{item.preview}</p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-medium text-gray-700">
                  {formatScheduledTime(item.scheduledFor)}
                </p>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <button
                    onClick={() => setEditItem(item)}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => cancelItem(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Time-until bar */}
            <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      5,
                      100 -
                        ((item.scheduledFor.getTime() - Date.now()) /
                          (1000 * 60 * 60 * 48)) *
                          100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-gray-500 text-sm">No scheduled emails</p>
            <p className="text-gray-400 text-xs mt-1">
              Schedule a reply from any email thread
            </p>
          </div>
        )}
      </div>

      {editItem && (
        <ComposeModal
          open
          onClose={() => setEditItem(null)}
          mode="scheduled"
          replyTo={{
            email: editItem.to,
            name: editItem.to.split("@")[0],
            subject: editItem.subject,
            threadId: editItem.threadId,
          }}
        />
      )}
    </div>
  );
}
