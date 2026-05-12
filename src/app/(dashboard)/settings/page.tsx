"use client";

import { useState } from "react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
        checked ? "bg-blue-500" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 divide-y divide-gray-100">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [notifyNewEmail, setNotifyNewEmail] = useState(true);
  const [notifyFollowup, setNotifyFollowup] = useState(true);
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [aiSummary, setAiSummary] = useState(true);
  const [composeSignature, setComposeSignature] = useState(false);
  const [signature, setSignature] = useState("Best,\nMarti");

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="font-semibold text-gray-900 text-sm">Settings</h1>
        <p className="text-xs text-gray-400">Manage your KHU Mail preferences</p>
      </div>

      <div className="flex-1 p-6 space-y-5 max-w-2xl w-full mx-auto">
        {/* Profile */}
        <Section title="Profile">
          <div className="py-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">martijaneti</p>
              <p className="text-sm text-gray-500">kunow159@gmail.com</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-green-700">Gmail connected</span>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            label="New email toast"
            description="Show a toast when a new email arrives"
          >
            <Toggle checked={notifyNewEmail} onChange={setNotifyNewEmail} />
          </SettingRow>
          <SettingRow
            label="Follow-up reminders"
            description="Notify before a scheduled follow-up sends"
          >
            <Toggle checked={notifyFollowup} onChange={setNotifyFollowup} />
          </SettingRow>
        </Section>

        {/* Reading */}
        <Section title="Reading">
          <SettingRow
            label="Auto-mark as read"
            description="Mark emails as read when you open them"
          >
            <Toggle checked={autoMarkRead} onChange={setAutoMarkRead} />
          </SettingRow>
          <SettingRow
            label="AI summaries"
            description="Show AI-generated summaries at the top of threads"
          >
            <Toggle checked={aiSummary} onChange={setAiSummary} />
          </SettingRow>
        </Section>

        {/* Compose */}
        <Section title="Compose">
          <SettingRow
            label="Email signature"
            description="Append signature to all new emails"
          >
            <Toggle checked={composeSignature} onChange={setComposeSignature} />
          </SettingRow>
          {composeSignature && (
            <div className="pb-4">
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                placeholder="Your email signature"
              />
            </div>
          )}
        </Section>

        {/* Account */}
        <Section title="Account">
          <SettingRow
            label="Disconnect Gmail"
            description="Remove Gmail access and sign out"
          >
            <button className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
              Disconnect
            </button>
          </SettingRow>
        </Section>

        <p className="text-center text-xs text-gray-400 pb-4">
          KHU Mail · Demo mode · Settings are not persisted
        </p>
      </div>
    </div>
  );
}
