"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailList } from "@/components/email/EmailList";
import { EmailListSkeleton } from "@/components/email/EmailListSkeleton";
import { EmailThreadView } from "@/components/email/EmailThread";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { ShortcutsModal } from "@/components/ui/ShortcutsModal";
import { Button } from "@/components/ui/Button";
import { MOCK_THREADS, EmailThread } from "@/lib/mock-data";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/context/ToastContext";
import { useInboxContext } from "@/context/InboxContext";

function deserializeThread(raw: EmailThread & {
  lastMessage: Omit<EmailThread["lastMessage"], "date"> & { date: string };
  messages: (Omit<EmailThread["messages"][number], "date"> & { date: string })[];
}): EmailThread {
  return {
    ...raw,
    lastMessage: { ...raw.lastMessage, date: new Date(raw.lastMessage.date) },
    messages: raw.messages.map((m) => ({ ...m, date: new Date(m.date) })),
  };
}

type FilterTab = "all" | "unread" | "attachments" | "starred" | "important";

const EMPTY_STATE: Record<FilterTab, { icon: string; title: string; subtitle: string }> = {
  all: { icon: "📭", title: "Inbox zero!", subtitle: "You're all caught up." },
  unread: { icon: "✅", title: "All caught up!", subtitle: "No unread emails." },
  attachments: { icon: "📎", title: "No attachments", subtitle: "Emails with files appear here." },
  starred: { icon: "⭐", title: "No starred emails", subtitle: "Press S to star an email." },
  important: { icon: "🏷️", title: "Nothing marked important", subtitle: "Important emails appear here." },
};

const MIN_LIST_WIDTH = 260;
const MAX_LIST_WIDTH = 580;
const DEFAULT_LIST_WIDTH = 320;

function usePanelResize() {
  const [listWidth, setListWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_LIST_WIDTH;
    return parseInt(localStorage.getItem("khu_list_width") ?? String(DEFAULT_LIST_WIDTH), 10);
  });
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    localStorage.setItem("khu_list_width", String(listWidth));
  }, [listWidth]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = listWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const newW = Math.max(MIN_LIST_WIDTH, Math.min(MAX_LIST_WIDTH, startWidth.current + ev.clientX - startX.current));
      setListWidth(newW);
    }
    function onUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [listWidth]);

  return { listWidth, onDragStart };
}

export default function InboxPage() {
  const router = useRouter();
  const toast = useToast();
  const { setUnreadCount } = useInboxContext();
  const { listWidth, onDragStart } = usePanelResize();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [archived, setArchived] = useState<EmailThread[]>([]);
  const [snoozed, setSnoozed] = useState<{ thread: EmailThread; until: Date }[]>([]);
  const snoozeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmailThread | null>(null);
  const [threadDetailLoading, setThreadDetailLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const archiveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    async function loadThreads() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/gmail/threads");
        if (res.status === 503) {
          // Demo mode — fall back to mock data
          setThreads(MOCK_THREADS);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.error === "no_gmail_token") {
            setFetchError("Gmail not connected. Please sign out and sign in again to grant access.");
          } else {
            setFetchError("Could not load your inbox. Showing demo data instead.");
          }
          setThreads(MOCK_THREADS);
          return;
        }
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loaded: EmailThread[] = (data.threads ?? []).map((t: any) => deserializeThread(t));
        setThreads(loaded);

        // Backfill any previously cached AI summaries without blocking inbox render
        if (loaded.length > 0) {
          const ids = loaded.map((t) => t.id).join(",");
          fetch(`/api/ai/summaries?threadIds=${encodeURIComponent(ids)}`)
            .then((r) => r.json())
            .then((aiData: { summaries?: Record<string, string> }) => {
              if (!aiData.summaries) return;
              setThreads((prev) =>
                prev.map((t) =>
                  aiData.summaries![t.id]
                    ? { ...t, aiSummary: aiData.summaries![t.id] }
                    : t
                )
              );
            })
            .catch(() => {/* non-critical — inbox still works without summaries */});
        }
      } catch {
        setFetchError("Network error. Showing demo data instead.");
        setThreads(MOCK_THREADS);
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, []);

  const filtered = useMemo(() => {
    let result = threads;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.lastMessage.from.toLowerCase().includes(q) ||
          t.lastMessage.preview.toLowerCase().includes(q)
      );
    }
    if (activeTab === "unread") result = result.filter((t) => t.unread);
    if (activeTab === "attachments") result = result.filter((t) => t.hasAttachments);
    if (activeTab === "starred") result = result.filter((t) => t.starred);
    if (activeTab === "important") result = result.filter((t) => t.labels.includes("important"));
    if (sortAsc) result = [...result].sort((a, b) => a.lastMessage.date.getTime() - b.lastMessage.date.getTime());
    return result;
  }, [threads, search, activeTab, sortAsc]);

  const selectedIdx = useMemo(
    () => filtered.findIndex((t) => t.id === selected?.id),
    [filtered, selected]
  );

  const allChecked = filtered.length > 0 && filtered.every((t) => checkedIds.has(t.id));
  const someChecked = checkedIds.size > 0;

  const toggleStar = useCallback((id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
    setSelected((prev) => prev?.id === id ? { ...prev, starred: !prev.starred } : prev);
  }, []);

  const toggleRead = useCallback((id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: !t.unread } : t))
    );
  }, []);

  const markRead = useCallback((id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: false } : t))
    );
  }, []);

  const archive = useCallback(
    (id: string) => {
      const thread = threads.find((t) => t.id === id);
      if (!thread) return;

      setThreads((prev) => prev.filter((t) => t.id !== id));
      setArchived((prev) => [thread, ...prev]);
      if (selected?.id === id) setSelected(null);
      setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });

      const timer = setTimeout(() => {
        setArchived((prev) => prev.filter((t) => t.id !== id));
        archiveTimers.current.delete(id);
      }, 10000);
      archiveTimers.current.set(id, timer);

      toast.show("Archived", "info", {
        label: "Undo",
        onClick: () => {
          const t = archiveTimers.current.get(id);
          if (t) { clearTimeout(t); archiveTimers.current.delete(id); }
          setArchived((prev) => prev.filter((t) => t.id !== id));
          setThreads((prev) => {
            if (prev.find((t) => t.id === id)) return prev;
            return [thread, ...prev].sort(
              (a, b) => b.lastMessage.date.getTime() - a.lastMessage.date.getTime()
            );
          });
          toast.show("Restored to inbox", "success");
        },
      });
    },
    [threads, selected, toast]
  );

  const snooze = useCallback(
    (id: string, until: Date) => {
      const thread = threads.find((t) => t.id === id);
      if (!thread) return;
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (selected?.id === id) setSelected(null);
      setSnoozed((prev) => [...prev, { thread, until }]);

      const ms = until.getTime() - Date.now();
      const timer = setTimeout(() => {
        setSnoozed((prev) => prev.filter((s) => s.thread.id !== id));
        setThreads((prev) => {
          if (prev.find((t) => t.id === id)) return prev;
          return [{ ...thread, unread: true }, ...prev].sort(
            (a, b) => b.lastMessage.date.getTime() - a.lastMessage.date.getTime()
          );
        });
        snoozeTimers.current.delete(id);
        toast.show(`Snoozed email from ${thread.lastMessage.from} is back`, "info");
      }, Math.max(ms, 1000));
      snoozeTimers.current.set(id, timer);

      const timeStr = until.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const dateStr = until.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = until.toDateString() === new Date().toDateString();
      toast.show(`Snoozed until ${isToday ? timeStr : `${dateStr} ${timeStr}`}`, "info", {
        label: "Undo",
        onClick: () => {
          const t = snoozeTimers.current.get(id);
          if (t) { clearTimeout(t); snoozeTimers.current.delete(id); }
          setSnoozed((prev) => prev.filter((s) => s.thread.id !== id));
          setThreads((prev) => {
            if (prev.find((t) => t.id === id)) return prev;
            return [thread, ...prev].sort(
              (a, b) => b.lastMessage.date.getTime() - a.lastMessage.date.getTime()
            );
          });
          toast.show("Unsnooze: email restored", "success");
        },
      });
    },
    [threads, selected, toast]
  );

  const updateLabels = useCallback((id: string, labels: string[]) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, labels } : t)));
    setSelected((prev) => prev?.id === id ? { ...prev, labels } : prev);
  }, []);

  const archiveBulk = useCallback(() => {
    const ids = Array.from(checkedIds);
    const count = ids.length;
    const archivedThreads = threads.filter((t) => ids.includes(t.id));

    setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
    setArchived((prev) => [...archivedThreads, ...prev]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    setCheckedIds(new Set());

    const timers = ids.map((id) => {
      const timer = setTimeout(() => {
        setArchived((prev) => prev.filter((t) => t.id !== id));
        archiveTimers.current.delete(id);
      }, 10000);
      archiveTimers.current.set(id, timer);
      return { id, timer };
    });

    toast.show(`${count} archived`, "info", {
      label: "Undo",
      onClick: () => {
        timers.forEach(({ id, timer }) => {
          clearTimeout(timer);
          archiveTimers.current.delete(id);
        });
        setArchived((prev) => prev.filter((t) => !ids.includes(t.id)));
        setThreads((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          const toRestore = archivedThreads.filter((t) => !existing.has(t.id));
          return [...toRestore, ...prev].sort(
            (a, b) => b.lastMessage.date.getTime() - a.lastMessage.date.getTime()
          );
        });
        toast.show(`${count} restored`, "success");
      },
    });
  }, [checkedIds, threads, selected, toast]);

  const markReadBulk = useCallback(() => {
    const ids = Array.from(checkedIds);
    setThreads((prev) => prev.map((t) => ids.includes(t.id) ? { ...t, unread: false } : t));
    setCheckedIds(new Set());
    toast.show(`${ids.length} marked as read`, "info");
  }, [checkedIds, toast]);

  const markAllRead = useCallback(() => {
    const count = threads.filter((t) => t.unread).length;
    if (!count) return;
    setThreads((prev) => prev.map((t) => ({ ...t, unread: false })));
    toast.show(`${count} email${count !== 1 ? "s" : ""} marked as read`, "info");
  }, [threads, toast]);

  async function handleSelect(thread: EmailThread) {
    if (someChecked) {
      setCheckedIds((prev) => {
        const n = new Set(prev);
        n.has(thread.id) ? n.delete(thread.id) : n.add(thread.id);
        return n;
      });
      return;
    }
    // Show immediately with preview, then fetch full thread content
    setSelected(thread);
    markRead(thread.id);

    // Skip full-fetch if thread already has real message bodies
    const hasBody = thread.messages.some((m) => m.body && m.body.length > 0);
    if (!hasBody) {
      setThreadDetailLoading(true);
      try {
        const res = await fetch(`/api/gmail/threads/${thread.id}`);
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const full: EmailThread = deserializeThread(data.thread as any);
          setThreads((prev) =>
            prev.map((t) => (t.id === full.id ? { ...full, unread: false } : t))
          );
          setSelected((prev) =>
            prev?.id === full.id ? { ...full, unread: false, aiSummary: prev.aiSummary, aiReplies: prev.aiReplies } : prev
          );
        }
      } catch {
        // Thread detail fetch failed — preview content still shows
      } finally {
        setThreadDetailLoading(false);
      }
    }

    // Fetch AI summary + replies (skip if already populated from cache)
    if (!thread.aiSummary || !thread.aiReplies) {
      fetch(`/api/ai/${thread.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((aiData: { summary?: string; replies?: { positive: string; neutral: string; negative: string } } | null) => {
          if (!aiData?.summary) return;
          setThreads((prev) =>
            prev.map((t) =>
              t.id === thread.id
                ? { ...t, aiSummary: aiData.summary, aiReplies: aiData.replies }
                : t
            )
          );
          setSelected((prev) =>
            prev?.id === thread.id
              ? { ...prev, aiSummary: aiData.summary, aiReplies: aiData.replies }
              : prev
          );
        })
        .catch(() => {/* non-critical — inbox works without AI content */});
    }
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filtered.map((t) => t.id)));
    }
  }

  const unreadCount = threads.filter((t) => t.unread).length;
  const starredCount = threads.filter((t) => t.starred).length;
  const importantCount = threads.filter((t) => t.labels.includes("important")).length;

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) KHU Mail` : "KHU Mail";
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  useKeyboardShortcuts([
    {
      key: "j",
      description: "Next email",
      handler: () => {
        if (!filtered.length) return;
        const next = filtered[selectedIdx < filtered.length - 1 ? selectedIdx + 1 : 0];
        handleSelect(next);
      },
    },
    {
      key: "k",
      description: "Previous email",
      handler: () => {
        if (!filtered.length) return;
        const prev = filtered[selectedIdx > 0 ? selectedIdx - 1 : filtered.length - 1];
        handleSelect(prev);
      },
    },
    {
      key: "r",
      description: "Reply",
      handler: () => { if (selected) setComposeOpen(true); },
    },
    {
      key: "s",
      description: "Star / unstar",
      handler: () => {
        if (selected) {
          toggleStar(selected.id);
          toast.show(selected.starred ? "Removed from starred" : "Added to starred", "success");
        }
      },
    },
    {
      key: "u",
      description: "Mark unread",
      handler: () => {
        if (selected) {
          toggleRead(selected.id);
          toast.show("Marked as unread", "info");
        }
      },
    },
    {
      key: "e",
      description: "Archive",
      handler: () => { if (selected) archive(selected.id); },
    },
    {
      key: "n",
      description: "Next unread",
      handler: () => {
        const startIdx = selectedIdx >= 0 ? selectedIdx + 1 : 0;
        const nextUnread =
          filtered.slice(startIdx).find((t) => t.unread) ??
          filtered.slice(0, startIdx).find((t) => t.unread);
        if (nextUnread) handleSelect(nextUnread);
      },
    },
    {
      key: "i",
      description: "Toggle important",
      handler: () => {
        if (!selected) return;
        const has = selected.labels.includes("important");
        const newLabels = has
          ? selected.labels.filter((l) => l !== "important")
          : [...selected.labels, "important"];
        updateLabels(selected.id, newLabels);
        toast.show(has ? "Removed important label" : "Marked as important", "success");
      },
    },
    {
      key: "Escape",
      description: "Back / clear selection",
      handler: () => {
        if (someChecked) { setCheckedIds(new Set()); return; }
        setSelected(null);
      },
    },
    {
      key: "c",
      description: "Compose",
      handler: () => setComposeOpen(true),
    },
    {
      key: "?",
      description: "Shortcuts",
      handler: () => setShortcutsOpen(true),
    },
    // g+key navigation chords (Gmail-style)
    { key: "i", chord: "g", description: "Go to inbox", handler: () => router.push("/inbox") },
    { key: "s", chord: "g", description: "Go to starred", handler: () => { router.push("/inbox"); setActiveTab("starred"); } },
    { key: "d", chord: "g", description: "Go to drafts", handler: () => router.push("/drafts") },
    { key: "t", chord: "g", description: "Go to sent", handler: () => router.push("/sent") },
    { key: "c", chord: "g", description: "Go to contacts", handler: () => router.push("/contacts") },
    { key: "/", chord: "g", description: "Go to search", handler: () => router.push("/search") },
  ]);

  const tabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "important", label: "Important", count: importantCount || undefined },
    { id: "starred", label: "Starred", count: starredCount || undefined },
    { id: "attachments", label: "Attach." },
  ];

  const emptyState = EMPTY_STATE[activeTab];

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div
        className={`flex flex-col border-gray-200 bg-white flex-shrink-0 ${
          selected ? "hidden md:flex border-r" : "flex w-full border-r md:border-r"
        }`}
        style={selected ? { width: listWidth } : undefined}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-0 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900 text-sm">Inbox</h1>
              <button
                onClick={() => setShortcutsOpen(true)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                title="Keyboard shortcuts (?)"
                aria-label="Show keyboard shortcuts"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* Sort toggle */}
              <button
                onClick={() => setSortAsc((v) => !v)}
                title={sortAsc ? "Oldest first" : "Newest first"}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Toggle sort order"
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${sortAsc ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  aria-label="Mark all as read"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compose
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emails…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Bulk action bar (replaces tabs when selection is active) */}
          {someChecked ? (
            <div className="flex items-center gap-2 py-1.5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-700 flex-1">
                {checkedIds.size} selected
              </span>
              <button
                onClick={markReadBulk}
                className="text-xs text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
              >
                Mark read
              </button>
              <button
                onClick={archiveBulk}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors font-medium"
              >
                Archive
              </button>
              <button
                onClick={() => setCheckedIds(new Set())}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear selection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            /* Filter tabs */
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {fetchError && !loading && (
          <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {fetchError}
          </div>
        )}

        {search && !loading && (
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <EmailListSkeleton count={6} />
          ) : (
            <>
              {/* Snoozed pill (shown when there are snoozed threads) */}
              {snoozed.length > 0 && (
                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-indigo-600 font-medium flex-1">
                    {snoozed.length} snoozed {snoozed.length === 1 ? "email" : "emails"}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {snoozed.slice(0, 2).map((s) => (
                      <span key={s.thread.id} className="text-[10px] text-indigo-500 bg-white border border-indigo-200 rounded-full px-2 py-0.5 truncate max-w-[100px]">
                        {s.thread.lastMessage.from.split(" ")[0]} · {s.until.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    ))}
                    {snoozed.length > 2 && <span className="text-[10px] text-indigo-500">+{snoozed.length - 2}</span>}
                  </div>
                </div>
              )}
              <EmailList
                threads={filtered}
                selectedId={selected?.id ?? null}
                checkedIds={checkedIds}
                searchQuery={search}
                onSelect={handleSelect}
                onToggleCheck={toggleCheck}
                onToggleStar={toggleStar}
                onArchive={archive}
                onToggleRead={toggleRead}
                emptyState={emptyState}
              />
            </>
          )}
        </div>
      </div>

      {/* Drag handle (desktop only, when thread is open) */}
      {selected && (
        <div
          onMouseDown={onDragStart}
          className="hidden md:flex w-1 flex-shrink-0 cursor-col-resize group items-stretch"
          title="Drag to resize"
        >
          <div className="w-full bg-gray-200 group-hover:bg-blue-400 transition-colors" />
        </div>
      )}

      {/* Thread panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {threadDetailLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center pointer-events-none">
              <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
          <EmailThreadView
            thread={selected}
            onBack={() => setSelected(null)}
            onToggleStar={toggleStar}
            onArchive={archive}
            onDelete={(id) => {
              setThreads((prev) => prev.filter((t) => t.id !== id));
              setSelected(null);
              toast.show("Email deleted", "info");
            }}
            onSnooze={snooze}
            onUpdateLabels={updateLabels}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-gray-400 text-sm">Select an email to read</p>
            <p className="text-gray-400 text-xs mt-1">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">?</kbd>{" "}
              for shortcuts
            </p>
          </div>
        </div>
      )}

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} mode="new" />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
