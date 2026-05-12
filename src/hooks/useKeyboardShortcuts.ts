"use client";

import { useEffect, useRef } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
  chord?: string; // prefix key, e.g. "g" for "g i"
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const pendingChord = useRef<string | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      // If we have a pending chord prefix, check for chord completions
      if (pendingChord.current) {
        const chord = pendingChord.current;
        pendingChord.current = null;
        if (chordTimer.current) { clearTimeout(chordTimer.current); chordTimer.current = null; }

        for (const s of shortcuts) {
          if (s.chord === chord && s.key === e.key) {
            e.preventDefault();
            s.handler();
            return;
          }
        }
        // Chord didn't match — fall through to single-key check
      }

      // Check if this key starts a chord
      const hasChordShortcuts = shortcuts.some((s) => s.chord === e.key);
      if (hasChordShortcuts && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        pendingChord.current = e.key;
        chordTimer.current = setTimeout(() => {
          pendingChord.current = null;
          chordTimer.current = null;
        }, 800);
        return;
      }

      for (const s of shortcuts) {
        if (s.chord) continue; // chord shortcuts need prefix
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        if (e.key === s.key && ctrlMatch && shiftMatch) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (chordTimer.current) clearTimeout(chordTimer.current);
    };
  }, [shortcuts]);
}
