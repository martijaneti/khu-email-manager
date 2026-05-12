"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInboxContext } from "@/context/InboxContext";

export function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useInboxContext();

  const tabs = [
    {
      label: "Inbox",
      href: "/inbox",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m4 0l2 3h4l2-3" />
        </svg>
      ),
    },
    {
      label: "Scheduled",
      href: "/scheduled",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Follow-ups",
      href: "/followups",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      label: "Sent",
      href: "/sent",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex md:hidden">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const badge = tab.href === "/inbox" && unreadCount > 0 ? unreadCount : null;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              active ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className={`relative ${active ? "text-blue-600" : "text-gray-400"}`}>
              {tab.icon}
              {badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
