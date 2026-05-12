"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface InboxContextValue {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const InboxContext = createContext<InboxContextValue>({
  unreadCount: 0,
  setUnreadCount: () => {},
});

export function useInboxContext() {
  return useContext(InboxContext);
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCountState] = useState(0);

  const setUnreadCount = useCallback((count: number) => {
    setUnreadCountState(count);
  }, []);

  return (
    <InboxContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </InboxContext.Provider>
  );
}
