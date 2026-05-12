"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface InboxContextValue {
  unreadCount: number;
  scheduledCount: number;
  followupCount: number;
  setUnreadCount: (count: number) => void;
  setScheduledCount: (count: number) => void;
  setFollowupCount: (count: number) => void;
}

const InboxContext = createContext<InboxContextValue>({
  unreadCount: 0,
  scheduledCount: 0,
  followupCount: 0,
  setUnreadCount: () => {},
  setScheduledCount: () => {},
  setFollowupCount: () => {},
});

export function useInboxContext() {
  return useContext(InboxContext);
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCountState] = useState(0);
  const [scheduledCount, setScheduledCountState] = useState(0);
  const [followupCount, setFollowupCountState] = useState(0);

  const setUnreadCount = useCallback((count: number) => setUnreadCountState(count), []);
  const setScheduledCount = useCallback((count: number) => setScheduledCountState(count), []);
  const setFollowupCount = useCallback((count: number) => setFollowupCountState(count), []);

  return (
    <InboxContext.Provider
      value={{ unreadCount, scheduledCount, followupCount, setUnreadCount, setScheduledCount, setFollowupCount }}
    >
      {children}
    </InboxContext.Provider>
  );
}
