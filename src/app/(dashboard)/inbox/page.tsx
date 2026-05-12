"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmailList } from "@/components/email/EmailList";
import { EmailListSkeleton } from "@/components/email/EmailListSkeleton";
import { EmailThreadView } from "@/components/email/EmailThread";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { ShortcutsModal } from "@/components/ui/ShortcutsModal";
import { Button } from "@/components/ui/Button";
import { MOCK_THREADS, EmailThread } from "@/lib/mock-data";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/context/ToastContext";

type FilterTab = "all" | "unread" | "attachments" | "starred";

export default function InboxPage() {
  const toast = useToast();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [archived, setArchived] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailThread | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const archiveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Simulate loading delay for skeleton demo
  useEffect(() => {
    const t = setTimeout(() => {
      setThreads(MOCK_THREADS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
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
    return result;
  }, [threads, search, activeTab]);

  const selectedIdx = useMemo(
    () => filtered.findIndex((t) => t.id === selected?.id),
    [filtered, selected]
  );

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

      // Remove from inbox
      setThreads((prev) => prev.filter((t) => t.id !== id));
      setArchived((prev) => [thread, ...prev]);
      if (selected?.id === id) setSelected(null);

      // Auto-purge archive entry after 10s (undo window)
      const timer = setTimeout(() => {
        setArchived((prev) => prev.filter((t) => t.id !== id));
        archiveTimers.current.delete(id);
      }, 10000);
      archiveTimers.current.set(id, timer);

      toast.show("Archived", "info", {
        label: "Undo",
        onClick: () => {
          // Cancel purge timer and restore
          const t = archiveTimers.current.get(id);
          if (t) {
            clearTimeout(t);
            archiveTimers.current.delete(id);
          }
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

  function handleSelect(thread: EmailThread) {
    setSelected(thread);
    markRead(thread.id);
  }

  const unreadCount = threads.filter((t) => t.unread).length;
  const starredCount = threads.filter((t) => t.starred).length;

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) KHU Mail` : "KHU Mail";
  }, [unreadCount]);

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
      key: "Escape",
      description: "Back to list",
      handler: () => setSelected(null),
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
  ]);

  const tabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "attachments", label: "Attachments" },
    { id: "starred", label: "Starred", count: starredCount || undefined },
  ];

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

          {/* Filter tabs */}
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
        </div>

        {search && !loading && (
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <EmailListSkeleton count={6} />
          ) : (
            <EmailList
              threads={filtered}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              onToggleStar={toggleStar}
              onArchive={archive}
              onToggleRead={toggleRead}
            />
          )}
        </div>
      </div>

      {/* Thread panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmailThreadView
            thread={selected}
            onBack={() => setSelected(null)}
            onToggleStar={toggleStar}
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
