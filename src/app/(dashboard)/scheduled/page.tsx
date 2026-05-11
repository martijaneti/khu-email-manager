"use client";

import { MOCK_SCHEDULED, formatScheduledTime } from "@/lib/mock-data";

export default function ScheduledPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-sm">Scheduled</h1>
        <p className="text-xs text-gray-400">{MOCK_SCHEDULED.length} queued</p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {MOCK_SCHEDULED.map((item) => (
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
                <button className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}

        {MOCK_SCHEDULED.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-gray-500 text-sm">No scheduled emails</p>
            <p className="text-gray-400 text-xs mt-1">
              Schedule a reply from any email thread
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
