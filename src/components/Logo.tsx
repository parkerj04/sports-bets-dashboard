export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="10" fill="#8b5cf6" />
      <rect x="9" y="14" width="14" height="10" rx="2.5" fill="#f3f3f6" />
      <path d="M12 14v-2.2a4 4 0 0 1 8 0V14" stroke="#f3f3f6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="18.5" r="1.3" fill="#4c1d95" />
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
