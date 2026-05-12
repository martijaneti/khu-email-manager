"use client";

import { useState } from "react";
import { KNOWN_CONTACTS, MOCK_THREADS, getInitials, getAvatarColor } from "@/lib/mock-data";
import { ComposeModal } from "@/components/compose/ComposeModal";

function getContactStats(email: string) {
  const received = MOCK_THREADS.filter((t) => t.lastMessage.fromEmail === email).length;
  const lastThread = MOCK_THREADS.filter((t) => t.lastMessage.fromEmail === email)
    .sort((a, b) => b.lastMessage.date.getTime() - a.lastMessage.date.getTime())[0];
  return { received, lastDate: lastThread?.lastMessage.date };
}

function formatContactDate(date: Date | undefined) {
  if (!date) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState({ email: "", name: "" });

  const filtered = KNOWN_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCompose(c: { name: string; email: string }) {
    setComposeTo(c);
    setComposeOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-gray-900 text-sm">Contacts</h1>
          <span className="text-xs text-gray-400">{KNOWN_CONTACTS.length} contacts</span>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
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
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-500 text-sm font-medium">No contacts found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((contact) => {
              const initials = getInitials(contact.name);
              const avatarColor = getAvatarColor(contact.email);
              const stats = getContactStats(contact.email);

              return (
                <div
                  key={contact.email}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    {stats.received > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">{stats.received} email{stats.received !== 1 ? "s" : ""}</p>
                        {stats.lastDate && (
                          <p className="text-[10px] text-gray-400">{formatContactDate(stats.lastDate)}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No emails yet</p>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => openCompose(contact)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  >
                    Email
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        mode="new"
        replyTo={{ email: composeTo.email, name: composeTo.name, subject: "" }}
      />
    </div>
  );
}
