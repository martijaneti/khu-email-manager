"use client";

import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 80;

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;  // archive
  onSwipeRight?: () => void; // star
  className?: string;
}

export function SwipeableRow({ children, onSwipeLeft, onSwipeRight, className }: SwipeableRowProps) {
  const startX = useRef(0);
  const startY = useRef(0);
  const [deltaX, setDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwiping(false);
    setDeltaX(0);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    // Only track horizontal swipes (ignore scrolling)
    if (!swiping && Math.abs(dy) > Math.abs(dx)) return;
    setSwiping(true);
    // Only allow left swipe (archive) and right swipe (star)
    if (dx < 0 && !onSwipeLeft) return;
    if (dx > 0 && !onSwipeRight) return;
    setDeltaX(Math.sign(dx) * Math.min(Math.abs(dx), 120));
  }

  function onTouchEnd() {
    if (!swiping) { setDeltaX(0); return; }

    if (deltaX < -SWIPE_THRESHOLD && onSwipeLeft) {
      setExiting("left");
      setTimeout(() => {
        onSwipeLeft();
        setExiting(null);
        setDeltaX(0);
        setSwiping(false);
      }, 250);
    } else if (deltaX > SWIPE_THRESHOLD && onSwipeRight) {
      setExiting("right");
      setTimeout(() => {
        onSwipeRight();
        setExiting(null);
        setDeltaX(0);
        setSwiping(false);
      }, 250);
    } else {
      setDeltaX(0);
      setSwiping(false);
    }
  }

  const bgColor =
    exiting === "left" || deltaX < -SWIPE_THRESHOLD / 2
      ? "bg-red-500"
      : exiting === "right" || deltaX > SWIPE_THRESHOLD / 2
      ? "bg-amber-400"
      : "bg-transparent";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe action backgrounds */}
      <div className={`absolute inset-0 flex items-center justify-between px-4 transition-colors ${bgColor}`}>
        <div className={`transition-opacity ${deltaX > 20 ? "opacity-100" : "opacity-0"}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div className={`transition-opacity ${deltaX < -20 ? "opacity-100" : "opacity-0"}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
      </div>

      {/* Sliding content */}
      <div
        style={{
          transform: exiting === "left"
            ? "translateX(-100%)"
            : exiting === "right"
            ? "translateX(100%)"
            : `translateX(${deltaX}px)`,
          transition: swiping && exiting === null ? "none" : "transform 250ms cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
