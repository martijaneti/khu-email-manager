"use client";

import { useEffect, useState } from "react";
import { MOCK_THREADS, MOCK_SENT, MOCK_SCHEDULED } from "@/lib/mock-data";

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

type Density = "compact" | "comfortable" | "cozy";

export default function SettingsPage() {
  const [notifyNewEmail, setNotifyNewEmail] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("khu_notif_toast") !== "false" : true
  );
  const [desktopNotif, setDesktopNotif] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("khu_notif_desktop") === "true" : false
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notifyFollowup, setNotifyFollowup] = useState(true);
  const [autoMarkRead, setAutoMarkRead] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("khu_auto_read") !== "false" : true
  );
  const [aiSummary, setAiSummary] = useState(true);
  const [density, setDensity] = useState<Density>(() =>
    (typeof window !== "undefined" ? (localStorage.getItem("khu_density") as Density) : null) ?? "comfortable"
  );
  const [composeSignature, setComposeSignature] = useState(false);
  const [signature, setSignature] = useState("Best,\nMarti");

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function handleToastToggle(v: boolean) {
    setNotifyNewEmail(v);
    localStorage.setItem("khu_notif_toast", String(v));
  }

  async function handleDesktopToggle(v: boolean) {
    if (!("Notification" in window)) return;
    if (v && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") { return; }
    }
    setDesktopNotif(v);
    localStorage.setItem("khu_notif_desktop", String(v));
  }

  function handleAutoReadToggle(v: boolean) {
    setAutoMarkRead(v);
    localStorage.setItem("khu_auto_read", String(v));
  }

  function handleDensityChange(d: Density) {
    setDensity(d);
    localStorage.setItem("khu_density", d);
  }

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
            description="Show an in-app toast when a new email arrives"
          >
            <Toggle checked={notifyNewEmail} onChange={handleToastToggle} />
          </SettingRow>
          <SettingRow
            label="Desktop notifications"
            description={
              notifPermission === "unsupported"
                ? "Not supported in this browser"
                : notifPermission === "denied"
                ? "Permission denied — allow in browser settings"
                : "Send OS notifications for new emails"
            }
          >
            <Toggle
              checked={desktopNotif && notifPermission === "granted"}
              onChange={handleDesktopToggle}
            />
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
            <Toggle checked={autoMarkRead} onChange={handleAutoReadToggle} />
          </SettingRow>
          <SettingRow
            label="AI summaries"
            description="Show AI-generated summaries at the top of threads"
          >
            <Toggle checked={aiSummary} onChange={setAiSummary} />
          </SettingRow>
          <SettingRow
            label="Email density"
            description="Adjust spacing in the email list"
          >
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["compact", "comfortable", "cozy"] as Density[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDensityChange(d)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                    density === d ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
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

        {/* Stats */}
        <Section title="Mailbox statistics">
          <div className="py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Inbox emails", value: MOCK_THREADS.length },
              { label: "Unread", value: MOCK_THREADS.filter((t) => t.unread).length },
              { label: "Starred", value: MOCK_THREADS.filter((t) => t.starred).length },
              { label: "With attachments", value: MOCK_THREADS.filter((t) => t.hasAttachments).length },
              { label: "Sent emails", value: MOCK_SENT.length },
              { label: "Scheduled", value: MOCK_SCHEDULED.length },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <p className="text-center text-xs text-gray-400 pb-4">
          KHU Mail · Demo mode · Settings are not persisted
        </p>
      </div>
    </div>
  );
}
