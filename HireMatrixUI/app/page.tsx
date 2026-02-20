import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "admin") redirect("/admin");
  if (role === "recruiter") redirect("/recruiter");
  if (role === "candidate") redirect("/candidate");
  if (role === "director") redirect("/director");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to HireMatrix Enterprise</h1>
        <p className="mt-2 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
