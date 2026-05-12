"use client";

import { useCallback, useState } from "react";
import { EmailThread as EmailThreadType, EmailMessage, getInitials, getAvatarColor } from "@/lib/mock-data";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { Button } from "@/components/ui/Button";

function MoreActionsMenu({ thread, onArchive, onDelete }: {
  thread: EmailThreadType;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    ...(onArchive ? [{ label: "Archive", icon: "🗂️", onClick: () => { onArchive(thread.id); setOpen(false); } }] : []),
    ...(onDelete ? [{ label: "Delete", icon: "🗑️", onClick: () => { onDelete(thread.id); setOpen(false); } }] : []),
    { label: "Mark as spam", icon: "🚫", onClick: () => { setOpen(false); } },
    { label: "Block sender", icon: "⛔", onClick: () => { setOpen(false); } },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="More actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44 overflow-hidden">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <span>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const LABEL_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "important", label: "Important", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "work", label: "Work", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "personal", label: "Personal", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "finance", label: "Finance", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "travel", label: "Travel", color: "bg-sky-100 text-sky-700 border-sky-200" },
];

function getLabelMeta(value: string) {
  return LABEL_OPTIONS.find((l) => l.value === value) ?? { value, label: value, color: "bg-gray-100 text-gray-600 border-gray-200" };
}

function LabelManager({
  labels,
  onChange,
}: {
  labels: string[];
  onChange: (labels: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {labels.map((l) => {
        const meta = getLabelMeta(l);
        return (
          <span key={l} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${meta.color}`}>
            {meta.label}
            <button
              onClick={() => onChange(labels.filter((x) => x !== l))}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Remove ${meta.label}`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          title="Add label"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-xs"
        >
          +
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-36 overflow-hidden">
              {LABEL_OPTIONS.filter((o) => !labels.includes(o.value)).map((o) => (
                <button
                  key={o.value}
                  onClick={() => { onChange([...labels, o.value]); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${o.color.split(" ")[0]}`} />
                  {o.label}
                </button>
              ))}
              {LABEL_OPTIONS.every((o) => labels.includes(o.value)) && (
                <p className="px-3 py-2 text-xs text-gray-400">All labels applied</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface EmailThreadProps {
  thread: EmailThreadType;
  onBack?: () => void;
  onToggleStar?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdateLabels?: (id: string, labels: string[]) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
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

function UnsubscribeBanner({ senderEmail }: { senderEmail: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-5 mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <p className="flex-1 text-xs text-amber-800">
        {unsubscribed ? `Unsubscribed from ${senderEmail}` : "This looks like a newsletter or promotional email."}
      </p>
      {!unsubscribed && (
        <button
          onClick={() => setUnsubscribed(true)}
          className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
        >
          Unsubscribe
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
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
            <div className="ml-11 flex flex-wrap gap-2 mt-2">
              {msg.attachments.map((att) => (
                <AttachmentPill key={att.name} {...att} />
              ))}
            </div>
          )}

          <div className="ml-11 mt-2">
            <CopyButton text={msg.body} />
          </div>
        </>
      )}
    </div>
  );
}

function hasUnsubscribeLink(body: string): boolean {
  return /unsubscribe|opt.?out|email preferences|manage.*subscription/i.test(body);
}

function printThread(thread: EmailThreadType) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>${thread.subject}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 680px; margin: 40px auto; color: #222; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
      .message { border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px; }
      .from { font-weight: bold; font-size: 14px; }
      .date { color: #888; font-size: 12px; }
      .body { font-size: 14px; line-height: 1.7; white-space: pre-wrap; margin-top: 12px; }
    </style></head><body>
    <h1>${thread.subject}</h1>
    <div class="meta">${thread.participants.join(", ")}</div>
    ${thread.messages
      .map(
        (m) => `<div class="message">
      <div class="from">${m.from} &lt;${m.fromEmail}&gt;</div>
      <div class="date">${m.date.toLocaleString()}</div>
      <div class="body">${m.body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>`
      )
      .join("")}
  </body></html>`);
  win.document.close();
  win.print();
}

function getQuickReplies(lastBody: string, subject: string): string[] {
  const lower = (lastBody + " " + subject).toLowerCase();
  if (lower.includes("available") || lower.includes("free") || lower.includes("chat") || lower.includes("sync") || lower.includes("call")) {
    return ["Sounds good, let's do it!", "I'm free Thursday afternoon.", "Let me check my calendar and get back to you."];
  }
  if (lower.includes("proposal") || lower.includes("terms") || lower.includes("review") || lower.includes("partnership")) {
    return ["Thanks, I'll review and get back to you.", "Looks good overall — a few questions...", "Can we schedule a call to discuss?"];
  }
  if (lower.includes("invoice") || lower.includes("payment") || lower.includes("receipt")) {
    return ["Received, thank you!", "Could you resend the invoice?", "I'll forward this to accounting."];
  }
  if (lower.includes("follow") || lower.includes("follow-up") || lower.includes("following up")) {
    return ["Thanks for following up!", "Sorry for the delay — working on it.", "I'll have an answer for you by EOD."];
  }
  return ["Thanks for reaching out!", "Noted, I'll get back to you soon.", "Sounds good!"];
}

export function EmailThreadView({ thread, onBack, onToggleStar, onArchive, onDelete, onUpdateLabels }: EmailThreadProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "scheduled" | "followup" | "new">("reply");
  const [forwardTo, setForwardTo] = useState<{ email: string; name: string; subject: string; threadId?: string } | undefined>();
  const [quickReplyBody, setQuickReplyBody] = useState<string | undefined>();

  const quickReplies = getQuickReplies(thread.lastMessage.body, thread.subject);

  function openCompose(mode: "reply" | "scheduled" | "followup", body?: string) {
    setComposeMode(mode);
    setForwardTo(undefined);
    setQuickReplyBody(body);
    setComposeOpen(true);
  }

  function openForward() {
    setComposeMode("new");
    const dateStr = thread.lastMessage.date.toLocaleString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const fwdBody = [
      "",
      "",
      "---------- Forwarded message ---------",
      `From: ${thread.lastMessage.from} <${thread.lastMessage.fromEmail}>`,
      `Date: ${dateStr}`,
      `Subject: ${thread.subject}`,
      `To: ${thread.participants.filter((p) => p !== thread.lastMessage.from).join(", ") || thread.participants.join(", ")}`,
      "",
      thread.lastMessage.body,
    ].join("\n");
    setQuickReplyBody(fwdBody);
    setForwardTo({
      email: "",
      name: "",
      subject: `Fwd: ${thread.subject}`,
      threadId: thread.id,
    });
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
          <Button variant="ghost" size="sm" onClick={() => printThread(thread)} title="Print email">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden lg:inline">Print</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={openForward}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Forward</span>
          </Button>
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
          <MoreActionsMenu thread={thread} onArchive={onArchive} onDelete={onDelete} />
        </div>
      </div>

      {/* Labels row */}
      {onUpdateLabels && (
        <div className="px-5 pt-2 pb-1">
          <LabelManager
            labels={thread.labels}
            onChange={(newLabels) => onUpdateLabels(thread.id, newLabels)}
          />
        </div>
      )}

      {/* Unsubscribe banner */}
      {hasUnsubscribeLink(thread.lastMessage.body) && (
        <UnsubscribeBanner senderEmail={thread.lastMessage.fromEmail} />
      )}

      {/* AI Summary */}
      {thread.aiSummary && <AISummaryCard summary={thread.aiSummary} />}

      {/* Thread meta: message count + read time */}
      {(() => {
        const totalWords = thread.messages.reduce((sum, m) => sum + m.body.split(/\s+/).filter(Boolean).length, 0);
        const readMins = Math.max(1, Math.ceil(totalWords / 200));
        return (
          <div className="mx-5 mt-3 flex items-center gap-3 text-xs text-gray-400">
            {thread.messages.length > 1 && (
              <span>{thread.messages.length} messages</span>
            )}
            <span>~{readMins} min read</span>
          </div>
        );
      })()}


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
      <div className="px-5 pt-3 pb-2 border-t border-gray-100 bg-gray-50 space-y-2">
        <button
          onClick={() => openCompose("reply")}
          className="w-full text-left text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:border-blue-300 hover:text-gray-600 transition-colors"
        >
          Reply to {thread.lastMessage.from}…
        </button>

        {/* AI quick reply suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap pb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
            AI
          </span>
          {quickReplies.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => openCompose("reply", suggestion)}
              className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-1 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors truncate max-w-[200px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setQuickReplyBody(undefined); }}
        mode={composeMode}
        replyTo={
          forwardTo ?? {
            email: thread.lastMessage.fromEmail,
            name: thread.lastMessage.from,
            subject: thread.subject,
            threadId: thread.id,
          }
        }
        initialBody={quickReplyBody}
      />
    </div>
  );
}
