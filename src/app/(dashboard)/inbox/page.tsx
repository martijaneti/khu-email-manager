"use client";

import { useMemo, useState } from "react";
import { EmailList } from "@/components/email/EmailList";
import { EmailThreadView } from "@/components/email/EmailThread";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { Button } from "@/components/ui/Button";
import { MOCK_THREADS, EmailThread } from "@/lib/mock-data";

type FilterTab = "all" | "unread" | "attachments" | "starred";

export default function InboxPage() {
  const [threads, setThreads] = useState<EmailThread[]>(MOCK_THREADS);
  const [selected, setSelected] = useState<EmailThread | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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

  function toggleStar(id: string) {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, starred: !prev.starred } : prev);
    }
  }

  function markRead(id: string) {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: false } : t))
    );
  }

  function handleSelect(thread: EmailThread) {
    setSelected(thread);
    markRead(thread.id);
  }

  const unreadCount = threads.filter((t) => t.unread).length;
  const starredCount = threads.filter((t) => t.starred).length;

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
          selected ? "hidden md:flex w-80 lg:w-96 xl:w-[420px]" : "flex w-full md:w-80 lg:w-96 xl:w-[420px]"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-0 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-900 text-sm">Inbox</h1>
            <Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compose
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-0 -mx-0.5 overflow-x-auto scrollbar-hide">
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

        {/* Results meta */}
        {search && (
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <EmailList
            threads={filtered}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
            onToggleStar={toggleStar}
          />
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
          </div>
        </div>
      )}

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} mode="new" />
    </div>
  );
}
