"use client";

import { useState } from "react";
import { EmailThread as EmailThreadType, getInitials, getAvatarColor } from "@/lib/mock-data";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { Button } from "@/components/ui/Button";

interface EmailThreadProps {
  thread: EmailThreadType;
  onBack?: () => void;
}

function AttachmentPill({ name, size, type }: { name: string; size: string; type: string }) {
  const icon = type === "pdf" ? "📄" : type === "image" ? "🖼️" : "📎";
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">
      <span>{icon}</span>
      <span className="font-medium text-gray-800 truncate max-w-[160px]">{name}</span>
      <span className="text-gray-400 text-xs">{size}</span>
    </div>
  );
}

export function EmailThreadView({ thread, onBack }: EmailThreadProps) {
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
        <div className="flex items-center gap-3 min-w-0">
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
          <h2 className="font-semibold text-gray-900 text-base leading-tight truncate">
            {thread.subject}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {thread.messages.map((msg) => {
          const initials = getInitials(msg.from);
          const avatarColor = getAvatarColor(msg.from);
          return (
            <div key={msg.id} className="space-y-3">
              {/* Sender row */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-gray-900">{msg.from}</span>
                      <span className="text-xs text-gray-400 ml-2">&lt;{msg.fromEmail}&gt;</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {msg.date.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">to {msg.to.join(", ")}</p>
                </div>
              </div>

              {/* Body */}
              <div className="ml-11 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {msg.body}
              </div>

              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="ml-11 flex flex-wrap gap-2">
                  {msg.attachments.map((att) => (
                    <AttachmentPill key={att.name} {...att} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
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

      {/* Compose modal */}
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
