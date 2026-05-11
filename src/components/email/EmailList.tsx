"use client";

import { EmailThread, formatRelativeTime, getInitials, getAvatarColor } from "@/lib/mock-data";

interface EmailListProps {
  threads: EmailThread[];
  selectedId: string | null;
  onSelect: (thread: EmailThread) => void;
  onToggleStar?: (id: string) => void;
}

function PaperclipIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-gray-300 hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

export function EmailList({ threads, selectedId, onSelect, onToggleStar }: EmailListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 text-sm">No emails found</p>
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
          <div
            key={thread.id}
            className={`relative flex gap-3 items-start px-4 py-3.5 cursor-pointer transition-colors group ${
              selected
                ? "bg-blue-50 border-l-2 border-blue-500"
                : "hover:bg-gray-50 border-l-2 border-transparent"
            }`}
            onClick={() => onSelect(thread)}
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

              <p className="text-xs text-gray-400 truncate">{thread.lastMessage.preview}</p>
            </div>

            {/* Right column — unread dot + star */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 mt-1">
              {thread.unread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              {onToggleStar && (
                <button
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${thread.starred ? "opacity-100" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(thread.id);
                  }}
                  aria-label={thread.starred ? "Unstar" : "Star"}
                >
                  <StarIcon filled={thread.starred} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
