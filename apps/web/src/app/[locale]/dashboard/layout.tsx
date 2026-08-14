import { UserButton } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeaderTitle } from "./header-title";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const homeHref = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-7 sm:px-10">
          <DashboardHeaderTitle />
          <UserButton afterSignOutUrl={homeHref} />
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
