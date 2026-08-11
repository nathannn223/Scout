import { UserButton } from "@clerk/nextjs";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeaderTitle } from "./header-title";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-7 sm:px-10">
          <DashboardHeaderTitle />
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
