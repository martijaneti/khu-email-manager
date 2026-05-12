"use client";

import { useMemo, useState } from "react";
import { MOCK_THREADS, MOCK_SENT, formatRelativeTime, getInitials, getAvatarColor, EmailThread } from "@/lib/mock-data";
import { ComposeModal } from "@/components/compose/ComposeModal";

type ResultKind = "inbox" | "sent";

interface SearchResult {
  kind: ResultKind;
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: Date;
  unread?: boolean;
  thread?: EmailThread;
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyThread, setReplyThread] = useState<EmailThread | undefined>();

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const out: SearchResult[] = [];

    for (const t of MOCK_THREADS) {
      const hit =
        t.subject.toLowerCase().includes(q) ||
        t.lastMessage.from.toLowerCase().includes(q) ||
        t.lastMessage.body.toLowerCase().includes(q) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q));
      if (hit) {
        out.push({
          kind: "inbox",
          id: t.id,
          from: t.lastMessage.from,
          subject: t.subject,
          preview: t.lastMessage.preview,
          date: t.lastMessage.date,
          unread: t.unread,
          thread: t,
        });
      }
    }

    for (const s of MOCK_SENT) {
      const hit =
        s.subject.toLowerCase().includes(q) ||
        s.toNames.join(", ").toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q);
      if (hit) {
        out.push({
          kind: "sent",
          id: s.id,
          from: `To: ${s.toNames.join(", ")}`,
          subject: s.subject,
          preview: s.preview,
          date: s.sentAt,
        });
      }
    }

    out.sort((a, b) => b.date.getTime() - a.date.getTime());
    return out;
  }, [query]);

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all emails…"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {query.trim().length >= 2 && (
          <p className="text-xs text-gray-400 mt-2">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query.trim()}&rdquo;
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() || query.trim().length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm font-medium">Search your emails</p>
            <p className="text-gray-400 text-xs mt-1">Searches inbox and sent messages</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm font-medium">No results found</p>
            <p className="text-gray-400 text-xs mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {results.map((r) => {
              const initials = getInitials(r.from.replace(/^To: /, ""));
              const avatarColor = getAvatarColor(r.from);
              return (
                <div
                  key={`${r.kind}-${r.id}`}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (r.thread) {
                      setReplyThread(r.thread);
                      setComposeOpen(true);
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold mt-0.5`}>
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${r.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        <Highlight text={r.from} query={query} />
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          r.kind === "sent" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                        }`}>
                          {r.kind}
                        </span>
                        <span className="text-xs text-gray-400">{formatRelativeTime(r.date)}</span>
                      </div>
                    </div>
                    <p className={`text-xs truncate mb-0.5 ${r.unread ? "font-medium text-gray-800" : "text-gray-600"}`}>
                      <Highlight text={r.subject} query={query} />
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      <Highlight text={r.preview} query={query} />
                    </p>
                  </div>

                  {/* Reply button (inbox only) */}
                  {r.thread && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setReplyThread(r.thread); setComposeOpen(true); }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium"
                    >
                      Reply
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {replyThread && (
        <ComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          mode="reply"
          replyTo={{
            email: replyThread.lastMessage.fromEmail,
            name: replyThread.lastMessage.from,
            subject: replyThread.subject,
            threadId: replyThread.id,
          }}
        />
      )}
    </div>
  );
}
