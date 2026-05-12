"use client";

import { Modal } from "./Modal";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["j"], desc: "Next email" },
      { keys: ["k"], desc: "Previous email" },
      { keys: ["Esc"], desc: "Back to list / clear selection" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["r"], desc: "Reply to selected email" },
      { keys: ["e"], desc: "Archive" },
      { keys: ["s"], desc: "Star / unstar" },
      { keys: ["u"], desc: "Mark unread" },
    ],
  },
  {
    title: "Compose",
    shortcuts: [
      { keys: ["c"], desc: "New email" },
      { keys: ["?"], desc: "Show shortcuts" },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <div className="p-5 space-y-5">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.shortcuts.map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600">{desc}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-1">
                        {i > 0 && <span className="text-gray-300 text-xs">then</span>}
                        <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-medium bg-gray-100 border border-gray-300 rounded-md text-gray-700 min-w-[28px]">
                          {k}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
