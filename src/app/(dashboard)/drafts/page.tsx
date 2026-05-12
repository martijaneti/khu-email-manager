"use client";

import { useEffect, useState } from "react";
import { ComposeModal } from "@/components/compose/ComposeModal";

interface DraftEntry {
  key: string;
  mode: string;
  threadId: string | undefined;
  body: string;
  to: string;
  subject: string;
  cc: string;
  savedAt: number;
}

function parseDraftKey(key: string): { mode: string; threadId: string | undefined } {
  // khu_draft_{mode}_{threadId}
  const parts = key.replace("khu_draft_", "").split("_");
  const mode = parts[0];
  const threadId = parts.slice(1).join("_") || undefined;
  return { mode, threadId: threadId === "new" ? undefined : threadId };
}

function formatDraftDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeKey, setComposeKey] = useState(0);
  const [selectedDraft, setSelectedDraft] = useState<DraftEntry | null>(null);

  function loadDrafts() {
    const found: DraftEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("khu_draft_")) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key) ?? "{}");
        if (!data.body) continue;
        const { mode, threadId } = parseDraftKey(key);
        found.push({
          key,
          mode,
          threadId,
          body: data.body ?? "",
          to: data.to ?? "",
          subject: data.subject ?? "",
          cc: data.cc ?? "",
          savedAt: data.savedAt ?? Date.now(),
        });
      } catch {
        // skip corrupt
      }
    }
    found.sort((a, b) => b.savedAt - a.savedAt);
    setDrafts(found);
  }

  useEffect(() => { loadDrafts(); }, []);

  function openDraft(draft: DraftEntry) {
    setSelectedDraft(draft);
    setComposeKey((k) => k + 1);
    setComposeOpen(true);
  }

  function deleteDraft(key: string) {
    localStorage.removeItem(key);
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  const modeLabel: Record<string, string> = {
    reply: "Reply draft",
    new: "New email draft",
    scheduled: "Scheduled draft",
    followup: "Follow-up draft",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 text-sm">Drafts</h1>
          <span className="text-xs text-gray-400">{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 text-sm font-medium">No drafts saved</p>
            <p className="text-gray-400 text-xs mt-1">Start composing an email to auto-save a draft.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {drafts.map((draft) => (
              <div
                key={draft.key}
                className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => openDraft(draft)}
              >
                {/* Draft icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs text-amber-600 font-medium">
                      {modeLabel[draft.mode] ?? "Draft"}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDraftDate(draft.savedAt)}</span>
                  </div>
                  {draft.to && (
                    <p className="text-sm font-medium text-gray-800 truncate mb-0.5">To: {draft.to}</p>
                  )}
                  {draft.subject && (
                    <p className="text-xs text-gray-600 truncate mb-0.5">{draft.subject}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{draft.body.replace(/\n/g, " ").slice(0, 100)}</p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDraft(draft.key); }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  aria-label="Delete draft"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDraft && (
        <ComposeModal
          key={composeKey}
          open={composeOpen}
          onClose={() => { setComposeOpen(false); loadDrafts(); }}
          mode={selectedDraft.mode as "new" | "reply" | "scheduled" | "followup"}
          replyTo={
            selectedDraft.to
              ? { email: selectedDraft.to, name: selectedDraft.to, subject: selectedDraft.subject, threadId: selectedDraft.threadId }
              : undefined
          }
          initialBody={undefined}
        />
      )}
    </div>
  );
}
