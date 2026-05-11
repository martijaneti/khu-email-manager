"use client";

import { EmailThread, formatRelativeTime, getInitials, getAvatarColor } from "@/lib/mock-data";

interface EmailListProps {
  threads: EmailThread[];
  selectedId: string | null;
  onSelect: (thread: EmailThread) => void;
}

function PaperclipIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

export function EmailList({ threads, selectedId, onSelect }: EmailListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 text-sm">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {threads.map((thread) => {
        const selected = selectedId === thread.id;
        const initials = getInitials(thread.lastMessage.from);
        const avatarColor = getAvatarColor(thread.lastMessage.from);

        return (
          <button
            key={thread.id}
            onClick={() => onSelect(thread)}
            className={`w-full text-left px-4 py-3.5 transition-colors flex gap-3 items-start ${
              selected
                ? "bg-blue-50 border-l-2 border-blue-500"
                : "hover:bg-gray-50 border-l-2 border-transparent"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold mt-0.5`}
            >
              {initials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span
                  className={`text-sm truncate ${
                    thread.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                  }`}
                >
                  {thread.lastMessage.from}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {thread.hasAttachments && <PaperclipIcon />}
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(thread.lastMessage.date)}
                  </span>
                </div>
              </div>

              <p
                className={`text-xs mb-1 truncate ${
                  thread.unread ? "font-medium text-gray-800" : "text-gray-600"
                }`}
              >
                {thread.subject}
              </p>

              <p className="text-xs text-gray-400 truncate">
                {thread.lastMessage.preview}
              </p>
            </div>

            {/* Unread dot */}
            {thread.unread && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}
