"use client";

import { EmailThread, formatRelativeTime, getInitials, getAvatarColor } from "@/lib/mock-data";
import { useToast } from "@/context/ToastContext";

interface EmptyState {
  icon: string;
  title: string;
  subtitle: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface EmailListProps {
  threads: EmailThread[];
  selectedId: string | null;
  checkedIds?: Set<string>;
  searchQuery?: string;
  onSelect: (thread: EmailThread) => void;
  onToggleCheck?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onArchive?: (id: string) => void;
  onToggleRead?: (id: string) => void;
  emptyState?: EmptyState;
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

export function EmailList({
  threads,
  selectedId,
  checkedIds,
  searchQuery = "",
  onSelect,
  onToggleCheck,
  onToggleStar,
  onArchive,
  onToggleRead,
  emptyState,
}: EmailListProps) {
  const toast = useToast();
  const selectionMode = checkedIds && checkedIds.size > 0;

  if (threads.length === 0) {
    const empty = emptyState ?? { icon: "📭", title: "No emails found", subtitle: "" };
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
        <div className="text-4xl mb-3">{empty.icon}</div>
        <p className="text-gray-500 text-sm font-medium">{empty.title}</p>
        {empty.subtitle && <p className="text-gray-400 text-xs mt-1">{empty.subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {threads.map((thread) => {
        const isSelected = selectedId === thread.id;
        const isChecked = checkedIds?.has(thread.id) ?? false;
        const initials = getInitials(thread.lastMessage.from);
        const avatarColor = getAvatarColor(thread.lastMessage.from);

        return (
          <div
            key={thread.id}
            className={`relative flex gap-3 items-start px-4 py-3.5 cursor-pointer transition-colors group ${
              isChecked
                ? "bg-blue-50"
                : isSelected
                ? "bg-blue-50 border-l-2 border-blue-500"
                : "hover:bg-gray-50 border-l-2 border-transparent"
            }`}
            onClick={() => onSelect(thread)}
          >
            {/* Checkbox / Avatar */}
            <div className="flex-shrink-0 relative mt-0.5" onClick={(e) => e.stopPropagation()}>
              {/* Checkbox: visible in selection mode or on hover */}
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity ${
                  selectionMode || isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCheck?.(thread.id)}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                  aria-label={`Select ${thread.subject}`}
                />
              </div>
              {/* Avatar: hidden in selection mode or on hover */}
              <div
                className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold transition-opacity ${
                  selectionMode || isChecked ? "opacity-0" : "opacity-100 group-hover:opacity-0"
                }`}
              >
                {initials}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span
                  className={`text-sm truncate ${
                    thread.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                  }`}
                >
                  <Highlight text={thread.lastMessage.from} query={searchQuery} />
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
                <Highlight text={thread.subject} query={searchQuery} />
              </p>

              <p className="text-xs text-gray-400 truncate">
                <Highlight text={thread.lastMessage.preview} query={searchQuery} />
              </p>
            </div>

            {/* Right: unread dot + hover actions */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 mt-1">
              {thread.unread && !selectionMode && (
                <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:hidden" />
              )}

              {/* Hover quick-action row (hidden in selection mode) */}
              {!selectionMode && (
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {onToggleStar && (
                    <button
                      title={thread.starred ? "Unstar" : "Star"}
                      className={`p-1.5 rounded-md transition-colors ${
                        thread.starred
                          ? "text-amber-400"
                          : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(thread.id);
                        toast.show(
                          thread.starred ? "Removed from starred" : "Added to starred",
                          "success"
                        );
                      }}
                    >
                      <StarIcon filled={thread.starred} />
                    </button>
                  )}

                  {onToggleRead && (
                    <button
                      title={thread.unread ? "Mark as read" : "Mark as unread"}
                      className="p-1.5 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRead(thread.id);
                        toast.show(thread.unread ? "Marked as read" : "Marked as unread", "info");
                      }}
                    >
                      {thread.unread ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="17" cy="8" r="4" className="fill-blue-500" />
                          <path fill="none" stroke="currentColor" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}

                  {onArchive && (
                    <button
                      title="Archive"
                      className="p-1.5 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(thread.id);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Star always visible if starred (not in selection mode, not hovered) */}
              {thread.starred && !selectionMode && (
                <div className="group-hover:hidden">
                  <StarIcon filled />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
