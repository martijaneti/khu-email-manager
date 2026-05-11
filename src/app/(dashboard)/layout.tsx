import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar unreadCount={3} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
