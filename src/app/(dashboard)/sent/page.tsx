"use client";

export default function SentPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900 text-sm">Sent</h1>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <div className="text-4xl mb-3">📤</div>
        <p className="text-gray-500 text-sm">No sent emails yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Sent emails will appear here once Gmail is connected
        </p>
      </div>
    </div>
  );
}
