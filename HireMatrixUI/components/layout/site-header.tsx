import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b bg-white/90 backdrop-blur dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
          HireMatrix Enterprise
        </Link>
        <nav className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
          <Link href="/recruiter" className="hover:underline">
            Recruiter
          </Link>
          <Link href="/candidate" className="hover:underline">
            Candidate
          </Link>
          <Link href="/director" className="hover:underline">
            Director
          </Link>
        </nav>
      </div>
    </header>
  );
}
