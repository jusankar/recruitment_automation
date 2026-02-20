import { Info } from "lucide-react";

export default function SiteFooter() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";

  return (
    <footer className="mt-auto border-t bg-white/80 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>(c) {new Date().getFullYear()} HireMatrix Enterprise. All rights reserved.</p>
        <p className="inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          {appVersion}
        </p>
      </div>
    </footer>
  );
}
