"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RecipientInput } from "./RecipientInput";

function insertFormatting(
  textarea: HTMLTextAreaElement,
  wrapper: [string, string] | null,
  template?: string,
  onUpdate?: (newVal: string) => void
) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selection = value.slice(start, end);

  let newText: string;
  let newStart: number;
  let newEnd: number;

  if (template) {
    newText = value.slice(0, start) + template + value.slice(end);
    newStart = start;
    newEnd = start + template.length;
  } else if (wrapper) {
    const [open, close] = wrapper;
    const inner = selection || "text";
    newText = value.slice(0, start) + open + inner + close + value.slice(end);
    newStart = start + open.length;
    newEnd = newStart + inner.length;
  } else {
    return;
  }

  onUpdate?.(newText);
  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();
  });
}

interface FormatButtonProps {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

function FormatButton({ title, onClick, children }: FormatButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-xs font-mono transition-colors"
    >
      {children}
    </button>
  );
}

type ComposeMode = "reply" | "scheduled" | "followup" | "new";

interface ReplyTo {
  email: string;
  name: string;
  subject: string;
  threadId?: string;
}

interface Attachment {
  file: File;
  id: string;
}

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  mode?: ComposeMode;
  replyTo?: ReplyTo;
  initialBody?: string;
}

const FOLLOWUP_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "3", label: "3 days" },
  { value: "5", label: "5 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
];

function draftKey(mode: ComposeMode, threadId?: string) {
  return `khu_draft_${mode}_${threadId ?? "new"}`;
}

function AttachmentRow({ att, onRemove }: { att: Attachment; onRemove: (id: string) => void }) {
  const size =
    att.file.size < 1024 * 1024
      ? `${Math.round(att.file.size / 1024)} KB`
      : `${(att.file.size / (1024 * 1024)).toFixed(1)} MB`;
  const ext = att.file.name.split(".").pop()?.toLowerCase();
  const icon = ["pdf"].includes(ext ?? "")
    ? "📄"
    : ["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "")
    ? "🖼️"
    : "📎";

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
      <span>{icon}</span>
      <span className="flex-1 truncate text-gray-800 font-medium">{att.file.name}</span>
      <span className="text-gray-400 text-xs">{size}</span>
      <button
        onClick={() => onRemove(att.id)}
        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Remove attachment"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ComposeModal({ open, onClose, mode = "reply", replyTo, initialBody }: ComposeModalProps) {
  const isNew = mode === "new" || !replyTo;

  const [sendMode, setSendMode] = useState<"now" | "scheduled">(
    mode === "scheduled" ? "scheduled" : "now"
  );
  const [followupEnabled, setFollowupEnabled] = useState(mode === "followup");
  const [followupDays, setFollowupDays] = useState("3");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 3);
    return d.toISOString().slice(0, 16);
  });
  const [to, setTo] = useState(replyTo?.email ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState(initialBody ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Restore draft on open (skip if quick reply body was provided)
  useEffect(() => {
    if (!open) return;
    if (initialBody) return; // quick reply — don't restore draft
    try {
      const saved = localStorage.getItem(draftKey(mode, replyTo?.threadId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.body) setBody(parsed.body);
        if (parsed.cc) { setCc(parsed.cc); setShowCcBcc(true); }
        if (parsed.bcc) { setBcc(parsed.bcc); setShowCcBcc(true); }
        if (isNew) {
          if (parsed.to) setTo(parsed.to);
          if (parsed.subject) setSubject(parsed.subject);
        }
        setDraftRestored(true);
      }
    } catch {
      // ignore corrupt draft
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autosave draft every 2s when content changes
  useEffect(() => {
    if (!open || sent) return;
    const timer = setTimeout(() => {
      try {
        const data = { body, cc, bcc, ...(isNew ? { to, subject } : {}) };
        if (body || cc || bcc || (isNew && (to || subject))) {
          localStorage.setItem(draftKey(mode, replyTo?.threadId), JSON.stringify(data));
        }
      } catch {
        // ignore storage errors
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [open, body, cc, bcc, to, subject, isNew, mode, replyTo?.threadId, sent]);

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey(mode, replyTo?.threadId));
    } catch {
      // ignore
    }
  }

  const titleMap: Record<ComposeMode, string> = {
    reply: "Reply",
    scheduled: "Schedule reply",
    followup: "Set follow-up",
    new: "New email",
  };

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newAtts: Attachment[] = Array.from(files).map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // Countdown → send effect (decrements 1/s, triggers send at 0)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      clearDraft();
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setCountdown(null);
        setBody("");
        setCc("");
        setBcc("");
        setAttachments([]);
        setDraftRestored(false);
        onClose();
      }, 1400);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function handleSend() {
    if (!body.trim()) return;
    setCountdown(5);
  }

  function handleUndo() {
    setCountdown(null);
  }

  function handleDiscard() {
    setCountdown(null);
    clearDraft();
    setBody("");
    setCc("");
    setBcc("");
    setAttachments([]);
    setDraftRestored(false);
    onClose();
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) { setBody((b) => b + emoji); setShowEmoji(false); return; }
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const newVal = value.slice(0, s) + emoji + value.slice(e);
    setBody(newVal);
    setShowEmoji(false);
    requestAnimationFrame(() => {
      ta.setSelectionRange(s + emoji.length, s + emoji.length);
      ta.focus();
    });
  }

  const isCounting = countdown !== null && countdown > 0;
  const sendLabel = sent
    ? "Sent!"
    : isCounting
    ? `Sending in ${countdown}…`
    : sendMode === "now"
    ? "Send"
    : "Schedule";

  return (
    <Modal open={open} onClose={handleDiscard} title={titleMap[mode]} size="lg">
      <div className="p-5 space-y-4">
        {draftRestored && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Draft restored
            <button
              className="ml-auto text-amber-600 hover:text-amber-800 font-medium"
              onClick={() => { setBody(""); setCc(""); setBcc(""); clearDraft(); setDraftRestored(false); }}
            >
              Discard draft
            </button>
          </div>
        )}

        {/* To / CC / BCC / Subject */}
        <div className="space-y-0 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-gray-400 w-10">To</span>
            <RecipientInput
              value={to}
              onChange={setTo}
              readOnly={!isNew}
              placeholder="recipient@example.com"
            />
            {!showCcBcc && (
              <button
                onClick={() => setShowCcBcc(true)}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0"
              >
                CC BCC
              </button>
            )}
          </div>

          {showCcBcc && (
            <>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-gray-400 w-10">CC</span>
                <RecipientInput
                  value={cc}
                  onChange={setCc}
                  placeholder="cc@example.com"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-gray-400 w-10">BCC</span>
                <RecipientInput
                  value={bcc}
                  onChange={setBcc}
                  placeholder="bcc@example.com"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-gray-400 w-10">Subj</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              readOnly={!isNew}
              className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent placeholder-gray-300"
              placeholder="Subject"
            />
          </div>
        </div>

        {/* Formatting toolbar + Body */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 bg-gray-50">
            <FormatButton title="Bold" onClick={() => insertFormatting(textareaRef.current!, ["**", "**"], undefined, setBody)}>
              <strong>B</strong>
            </FormatButton>
            <FormatButton title="Italic" onClick={() => insertFormatting(textareaRef.current!, ["_", "_"], undefined, setBody)}>
              <em>I</em>
            </FormatButton>
            <FormatButton title="Link" onClick={() => insertFormatting(textareaRef.current!, null, "[link text](url)", setBody)}>
              🔗
            </FormatButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <FormatButton title="Bullet list" onClick={() => insertFormatting(textareaRef.current!, null, "\n• ", setBody)}>
              ≡
            </FormatButton>
            <FormatButton title="Numbered list" onClick={() => insertFormatting(textareaRef.current!, null, "\n1. ", setBody)}>
              1.
            </FormatButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <FormatButton title="Horizontal rule" onClick={() => insertFormatting(textareaRef.current!, null, "\n---\n", setBody)}>
              —
            </FormatButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            {/* Emoji picker */}
            <div className="relative" ref={emojiRef}>
              <button
                type="button"
                title="Insert emoji"
                onMouseDown={(e) => { e.preventDefault(); setShowEmoji((v) => !v); }}
                className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm transition-colors"
              >
                😊
              </button>
              {showEmoji && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-52">
                    <div className="grid grid-cols-8 gap-0.5">
                      {["😊","👍","🙏","🎉","💪","🤝","✅","❌","📊","📅","🔥","💡","🚀","⚡","💬","📧","🎯","💼","📌","🔔","⭐","❤️","😂","👋","🙌","✨","😅","🤔"].map((e) => (
                        <button
                          key={e}
                          onMouseDown={(ev) => { ev.preventDefault(); insertEmoji(e); }}
                          className="text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative p-3">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (body.trim() && countdown === null && !sent) handleSend();
                }
              }}
              placeholder={
                mode === "followup"
                  ? "Follow-up message if they don't reply…"
                  : "Write your message…"
              }
              rows={7}
              className="w-full text-sm text-gray-800 focus:outline-none resize-none placeholder-gray-300 leading-relaxed"
            />
            {body.length > 0 && (
              <div className="absolute bottom-2 right-3 text-[10px] text-gray-300 select-none">
                {body.split(/\s+/).filter(Boolean).length} words · {body.length} chars
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <AttachmentRow key={att.id} att={att} onRemove={removeAttachment} />
            ))}
          </div>
        )}

        {/* Options bar */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {/* Send mode toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Send:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setSendMode("now")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  sendMode === "now" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                Now
              </button>
              <button
                onClick={() => setSendMode("scheduled")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  sendMode === "scheduled" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                }`}
              >
                Scheduled
              </button>
            </div>

            {sendMode === "scheduled" && (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-400"
              />
            )}
          </div>

          {/* Follow-up toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setFollowupEnabled((v) => !v)}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                followupEnabled ? "text-orange-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  followupEnabled ? "bg-orange-400" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    followupEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              Auto follow-up
            </button>

            {followupEnabled && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>if no reply within</span>
                <select
                  value={followupDays}
                  onChange={(e) => setFollowupDays(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
                >
                  {FOLLOWUP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50">
        {/* Countdown bar */}
        {isCounting && (
          <div className="relative overflow-hidden h-1 bg-gray-200">
            <div
              className="absolute inset-y-0 left-0 bg-blue-500 transition-all"
              style={{ width: `${((5 - countdown!) / 5) * 100}%`, transitionDuration: "1000ms" }}
            />
          </div>
        )}
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          {isCounting ? (
            /* Countdown mode: show undo button */
            <div className="flex items-center gap-3 w-full">
              <span className="text-sm text-gray-600 flex-1">{sendLabel}</span>
              <Button variant="secondary" size="sm" onClick={handleUndo}>
                Undo
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attach
                </Button>
                {attachments.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {attachments.length} file{attachments.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDiscard} disabled={sent}>
                  Discard
                </Button>
                <Button
                  variant={sent ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleSend}
                  disabled={sent || !body.trim()}
                  className={sent ? "bg-green-600 text-white hover:bg-green-600" : ""}
                >
                  {sent && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {sendLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
