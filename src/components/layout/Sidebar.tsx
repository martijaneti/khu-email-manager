"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

function InboxIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m4 0l2 3h4l2-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

export function Sidebar({ unreadCount = 3 }: { unreadCount?: number }) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Inbox", href: "/inbox", icon: <InboxIcon />, badge: unreadCount },
    { label: "Scheduled", href: "/scheduled", icon: <ClockIcon />, badge: 2 },
    { label: "Sent", href: "/sent", icon: <SendIcon /> },
    { label: "Follow-ups", href: "/followups", icon: <BellIcon />, badge: 1 },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            KM
          </div>
          <span className="font-semibold text-gray-900 text-sm">KHU Mail</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}>
                  {item.icon}
                </span>
                {item.label}
              </span>
              {item.badge ? (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  active ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
          <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">martijaneti</p>
            <p className="text-xs text-gray-500 truncate">Gmail connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
