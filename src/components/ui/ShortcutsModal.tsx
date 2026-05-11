"use client";

import { Modal } from "./Modal";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["j"], desc: "Next email" },
  { keys: ["k"], desc: "Previous email" },
  { keys: ["r"], desc: "Reply" },
  { keys: ["s"], desc: "Star / unstar" },
  { keys: ["u"], desc: "Mark unread" },
  { keys: ["Esc"], desc: "Back to list" },
  { keys: ["c"], desc: "Compose new email" },
  { keys: ["?"], desc: "Show shortcuts" },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <div className="p-5 space-y-2">
        {SHORTCUTS.map(({ keys, desc }) => (
          <div key={desc} className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600">{desc}</span>
            <div className="flex items-center gap-1">
              {keys.map((k) => (
                <kbd
                  key={k}
                  className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-medium bg-gray-100 border border-gray-300 rounded-md text-gray-700 min-w-[28px]"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
