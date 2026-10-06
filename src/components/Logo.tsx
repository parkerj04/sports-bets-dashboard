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

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={26} />
      <span className="font-semibold tracking-tight">The Locksmith</span>
    </span>
  );
}
