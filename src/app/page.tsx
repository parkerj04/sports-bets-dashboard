import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-semibold">Edge Desk</span>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/research" className="text-muted hover:text-accent">Research</Link>
            <Link href="/picks" className="text-muted hover:text-accent">Picks</Link>
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary px-3 py-1.5 text-xs">Join</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Picks. Research. <span className="text-accent">Edges.</span>
          </h1>
          <p className="text-muted text-lg">
            Follow daily plays backed by data — strikeout matchups, hitter spots,
            and transparent research. Create a free account to track everything.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href="/auth/signup" className="btn-primary px-6 py-3 text-sm">Create free account</Link>
            <Link href="/research" className="px-6 py-3 text-sm rounded-lg border border-card-border text-muted hover:text-foreground hover:border-muted transition-colors">
              View today’s research
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
