import { Hexagon } from "lucide-react";

export default function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-blue-600 p-1.5 text-white shadow-sm">
        <Hexagon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 sm:text-base">
        HireMatrix
      </span>
    </div>
  );
}
