"use client";

import { useEffect, useRef, useState } from "react";
import { KNOWN_CONTACTS, Contact, getInitials, getAvatarColor } from "@/lib/mock-data";

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function RecipientInput({ value, onChange, readOnly, placeholder }: RecipientInputProps) {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g., on modal open)
  useEffect(() => {
    setInputText(value);
  }, [value]);

  function getQueryFragment(text: string) {
    // Get the last comma-separated fragment being typed
    const parts = text.split(",");
    return parts[parts.length - 1].trim();
  }

  function handleInput(raw: string) {
    setInputText(raw);
    onChange(raw);
    const query = getQueryFragment(raw);
    if (query.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = KNOWN_CONTACTS.filter(
      (c) =>
        !raw.includes(c.email) && // don't suggest already-added
        (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    ).slice(0, 5);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
    setActiveSuggestion(-1);
  }

  function selectSuggestion(contact: Contact) {
    const parts = inputText.split(",").map((p) => p.trim()).filter(Boolean);
    parts[parts.length - 1] = contact.email; // replace last fragment
    const next = parts.join(", ") + ", ";
    setInputText(next);
    onChange(next);
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (activeSuggestion >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestion]);
      } else {
        setShowDropdown(false);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (readOnly) {
    return (
      <input
        type="text"
        value={value}
        readOnly
        className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent placeholder-gray-300"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          const q = getQueryFragment(inputText);
          if (q.length >= 1) setShowDropdown(suggestions.length > 0);
        }}
        className="w-full text-sm text-gray-800 focus:outline-none bg-transparent placeholder-gray-300"
        placeholder={placeholder ?? "recipient@example.com"}
        autoComplete="off"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((c, idx) => {
            const initials = getInitials(c.name);
            const color = getAvatarColor(c.name);
            return (
              <button
                key={c.email}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(c); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  idx === activeSuggestion ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold`}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
