import Link from "next/link";
import { BrandMark } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <BrandMark />
          <div className="flex gap-3 text-sm items-center">
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary px-4 py-2 text-xs">Request a key</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Members only</p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            We lock the plays.<br />You need a key.
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Daily research, pitch mixes, and Parker’s card — behind the account.
            No public board. No free picks.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href="/auth/signup" className="btn-primary px-6 py-3 text-sm">Create account</Link>
            <Link href="/auth/login" className="px-6 py-3 text-sm rounded-full border border-card-border text-muted hover:text-foreground">
              I already have a key
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
