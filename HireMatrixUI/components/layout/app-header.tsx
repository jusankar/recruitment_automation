"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BriefcaseBusiness, LayoutDashboard, LogIn, ShieldAlert, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/layout/app-logo";
import ThemeToggle from "@/components/layout/theme-toggle";

function getPageMeta(pathname: string): { title: string; icon: ComponentType<{ className?: string }> } {
  if (pathname.startsWith("/candidate")) return { title: "Interview Session", icon: UserCheck };
  if (pathname.startsWith("/recruiter")) return { title: "Recruiter Dashboard", icon: BriefcaseBusiness };
  if (pathname.startsWith("/director")) return { title: "Director Dashboard", icon: LayoutDashboard };
  if (pathname.startsWith("/admin")) return { title: "Admin Dashboard", icon: LayoutDashboard };
  if (pathname.startsWith("/login")) return { title: "Sign In", icon: LogIn };
  if (pathname.startsWith("/unauthorized")) return { title: "Unauthorized", icon: ShieldAlert };
  return { title: "HireMatrix Enterprise", icon: LayoutDashboard };
}

export default function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const PageIcon = pageMeta.icon;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="shrink-0">
            <AppLogo />
          </Link>
          <div className="hidden h-6 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
          <div className="flex min-w-0 items-center gap-2">
            <PageIcon className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" />
            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base">
              {pageMeta.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user?.email ? (
            <>
            <span className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              {session.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
