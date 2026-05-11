"use client";

import { useState } from "react";
import { EmailList } from "@/components/email/EmailList";
import { EmailThreadView } from "@/components/email/EmailThread";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { Button } from "@/components/ui/Button";
import { MOCK_THREADS, EmailThread } from "@/lib/mock-data";

export default function InboxPage() {
  const [threads] = useState<EmailThread[]>(MOCK_THREADS);
  const [selected, setSelected] = useState<EmailThread | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="flex h-full">
      {/* Email list panel — hidden on mobile when thread is open */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white ${
          selected ? "hidden md:flex w-80 lg:w-96" : "flex w-full md:w-80 lg:w-96"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">Inbox</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <EmailList
            threads={threads}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>
      </div>

      {/* Thread view */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmailThreadView
            thread={selected}
            onBack={() => setSelected(null)}
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

      {/* Compose modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        mode="new"
      />
    </div>
  );
}
