"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RecipientInput } from "./RecipientInput";

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

export function ComposeModal({ open, onClose, mode = "reply", replyTo }: ComposeModalProps) {
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
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on open
  useEffect(() => {
    if (!open) return;
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

  function handleDiscard() {
    clearDraft();
    setBody("");
    setCc("");
    setBcc("");
    setAttachments([]);
    setDraftRestored(false);
    onClose();
  }

  async function handleSend() {
    setSending(true);
    // Placeholder — will call /api/emails/send in Milestone 4
    await new Promise((r) => setTimeout(r, 800));
    clearDraft();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSending(false);
      setBody("");
      setCc("");
      setBcc("");
      setAttachments([]);
      setDraftRestored(false);
      onClose();
    }, 1200);
  }

  const sendLabel = sent
    ? "Sent!"
    : sending
    ? sendMode === "now"
      ? "Sending…"
      : "Scheduling…"
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

        {/* Body */}
        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              mode === "followup"
                ? "Follow-up message if they don't reply…"
                : "Write your message…"
            }
            rows={8}
            className="w-full text-sm text-gray-800 focus:outline-none resize-none placeholder-gray-300 leading-relaxed"
          />
          {body.length > 0 && (
            <div className="absolute bottom-1 right-0 text-[10px] text-gray-300 select-none">
              {body.split(/\s+/).filter(Boolean).length} words · {body.length} chars
            </div>
          )}
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
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
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
          <Button variant="secondary" size="sm" onClick={handleDiscard} disabled={sending}>
            Discard
          </Button>
          <Button
            variant={sent ? "secondary" : "primary"}
            size="sm"
            onClick={handleSend}
            disabled={sending || !body.trim()}
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
      </div>
    </Modal>
  );
}
