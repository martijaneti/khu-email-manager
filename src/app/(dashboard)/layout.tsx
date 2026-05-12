import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ToastProvider } from "@/context/ToastContext";
import { InboxProvider } from "@/context/InboxContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-white">
          <div className="hidden md:flex">
            <Sidebar />
          </div>

          <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
            {children}
          </main>

          <MobileNav />
        </div>
      </ToastProvider>
    </InboxProvider>
  );
}
