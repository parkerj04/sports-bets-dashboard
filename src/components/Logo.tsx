import { useId } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={id} x1="7" y1="4" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe7a8" />
          <stop offset="0.45" stopColor="#f0c14b" />
          <stop offset="1" stopColor="#9a6a12" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#101820" />
      <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="7" fill="none" stroke={`url(#${id})`} strokeWidth="1.4" />
      <path d="M10.6 15.4V11.4a5.4 5.4 0 0 1 10.8 0v4" fill="none" stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="7.6" y="14.4" width="16.8" height="12.2" rx="3.2" fill={`url(#${id})`} />
      <circle cx="16" cy="19.1" r="1.55" fill="#101820" />
      <path d="M15.25 20.2h1.5l.55 3.15h-2.6z" fill="#101820" />
    </svg>
  );
}

export function BrandMark({ wide = false, className = "" }: { wide?: boolean; className?: string }) {
  if (!wide) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Logo size={26} />
        <span className="font-semibold tracking-tight">The Locksmith</span>
      </span>
    );
  }
  return (
    <span className={`flex w-full min-w-0 items-center gap-3 ${className}`}>
      <span className="relative grid size-11 shrink-0 place-items-center">
        <span className="absolute inset-1 rounded-2xl bg-accent/25 blur-md" />
        <Logo size={36} />
      </span>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.22em]">The Locksmith</span>
      <span className="flex min-w-8 flex-1 items-center">
        <span className="h-px flex-1 bg-accent" />
        <span className="mx-2 size-1.5 shrink-0 rotate-45 bg-accent" />
        <span className="h-px flex-1 bg-gradient-to-r from-accent to-accent/20" />
      </span>
    </span>
  );
}
