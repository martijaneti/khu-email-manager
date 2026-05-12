"use client";

import { useState } from "react";
import { MOCK_SENT, SentEmail, formatRelativeTime, getInitials, getAvatarColor } from "@/lib/mock-data";

function PaperclipIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
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

function SentThreadView({ email, onBack }: { email: SentEmail; onBack: () => void }) {
  const initials = getInitials("You");
  const avatarColor = "bg-indigo-500";

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden flex-shrink-0 text-gray-400 hover:text-gray-700 p-1 -ml-1"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-gray-900 text-base leading-tight truncate flex-1">
          {email.subject}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm text-gray-900">You</span>
                  <span className="text-xs text-gray-400 ml-2">&lt;kunow159@gmail.com&gt;</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {email.sentAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                to {email.toNames.join(", ")}
              </p>
            </div>
          </div>

          <div className="ml-11 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {email.body}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="ml-11 flex flex-wrap gap-2 mt-2">
              {email.attachments.map((att) => (
                <AttachmentPill key={att.name} {...att} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SentPage() {
  const [selected, setSelected] = useState<SentEmail | null>(null);

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white ${
          selected
            ? "hidden md:flex w-80 lg:w-96 xl:w-[420px]"
            : "flex w-full md:w-80 lg:w-96 xl:w-[420px]"
        }`}
      >
        <div className="px-4 py-3.5 border-b border-gray-100">
          <h1 className="font-semibold text-gray-900 text-sm">Sent</h1>
          <p className="text-xs text-gray-400">{MOCK_SENT.length} messages</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {MOCK_SENT.map((email) => {
            const recipientName = email.toNames[0] + (email.toNames.length > 1 ? ` +${email.toNames.length - 1}` : "");
            const avatarColor = getAvatarColor(email.toNames[0]);
            const initials = getInitials(email.toNames[0]);
            const isSelected = selected?.id === email.id;

            return (
              <div
                key={email.id}
                onClick={() => setSelected(email)}
                className={`relative flex gap-3 items-start px-4 py-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-50 border-l-2 border-blue-500"
                    : "hover:bg-gray-50 border-l-2 border-transparent"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold mt-0.5`}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      To: {recipientName}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {email.hasAttachments && <PaperclipIcon />}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(email.sentAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs mb-1 truncate font-medium text-gray-600">
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{email.preview}</p>
                </div>
              </div>
            );
          })}

          {MOCK_SENT.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="text-4xl mb-3">📤</div>
              <p className="text-gray-500 text-sm">No sent emails yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Sent emails will appear here once Gmail is connected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thread panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <SentThreadView email={selected} onBack={() => setSelected(null)} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">📤</div>
            <p className="text-gray-400 text-sm">Select a sent email to read</p>
          </div>
        </div>
      )}
    </div>
  );
}
