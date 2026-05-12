"use client";

import { useState } from "react";
import { EmailThread as EmailThreadType, EmailMessage, getInitials, getAvatarColor } from "@/lib/mock-data";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { Button } from "@/components/ui/Button";

interface EmailThreadProps {
  thread: EmailThreadType;
  onBack?: () => void;
  onToggleStar?: (id: string) => void;
}

function AttachmentPill({ name, size, type }: { name: string; size: string; type: string }) {
  const icon = type === "pdf" ? "📄" : ["png", "jpg", "jpeg", "gif"].includes(type) ? "🖼️" : "📎";
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">
      <span>{icon}</span>
      <span className="font-medium text-gray-800 truncate max-w-[160px]">{name}</span>
      <span className="text-gray-400 text-xs">{size}</span>
    </div>
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

function AISummaryCard({ summary }: { summary: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="mx-5 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center mt-0.5">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-700 mb-1">AI Summary</p>
        <p className="text-xs text-blue-800 leading-relaxed">{summary}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-blue-300 hover:text-blue-500 transition-colors mt-0.5"
        aria-label="Dismiss summary"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function MessageItem({
  msg,
  defaultExpanded,
}: {
  msg: EmailMessage;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const initials = getInitials(msg.from);
  const avatarColor = getAvatarColor(msg.from);

  const dateStr = msg.date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-3">
      <button
        className="w-full flex items-start gap-3 text-left group"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-gray-900">{msg.from}</span>
              {!expanded && (
                <span className="text-xs text-gray-400 truncate">{msg.body.split("\n")[0].slice(0, 60)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{dateStr}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {expanded && (
            <p className="text-xs text-gray-400">to {msg.to.join(", ")}</p>
          )}
        </div>
      </button>

      {expanded && (
        <>
          <div className="ml-11 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {msg.body}
          </div>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="ml-11 flex flex-wrap gap-2">
              {msg.attachments.map((att) => (
                <AttachmentPill key={att.name} {...att} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function EmailThreadView({ thread, onBack, onToggleStar }: EmailThreadProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "scheduled" | "followup">("reply");

  function openCompose(mode: "reply" | "scheduled" | "followup") {
    setComposeMode(mode);
    setComposeOpen(true);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex-shrink-0 text-gray-400 hover:text-gray-700 p-1 -ml-1"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {onToggleStar && (
            <button
              onClick={() => onToggleStar(thread.id)}
              className="flex-shrink-0"
              aria-label={thread.starred ? "Unstar" : "Star"}
            >
              <StarIcon filled={thread.starred} />
            </button>
          )}
          <h2 className="font-semibold text-gray-900 text-base leading-tight truncate">
            {thread.subject}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => openCompose("scheduled")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Schedule</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openCompose("followup")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="hidden sm:inline">Follow-up</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => openCompose("reply")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {thread.aiSummary && <AISummaryCard summary={thread.aiSummary} />}

      {/* Message count badge for multi-message threads */}
      {thread.messages.length > 1 && (
        <div className="mx-5 mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">
            {thread.messages.length} messages
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {thread.messages.map((msg, idx) => (
          <div key={msg.id} className={idx < thread.messages.length - 1 ? "pb-4 border-b border-gray-100" : ""}>
            <MessageItem
              msg={msg}
              defaultExpanded={idx === thread.messages.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Quick reply bar */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <button
          onClick={() => openCompose("reply")}
          className="w-full text-left text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-blue-300 hover:text-gray-600 transition-colors"
        >
          Reply to {thread.lastMessage.from}…
        </button>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        mode={composeMode}
        replyTo={{
          email: thread.lastMessage.fromEmail,
          name: thread.lastMessage.from,
          subject: thread.subject,
          threadId: thread.id,
        }}
      />
    </div>
  );
}
