export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="#16110a" stroke="#c9a46a" strokeWidth="2" />
      <path d="M24 10c-4.4 0-8 3.5-8 7.8v3.2h3.2v-3.2c0-2.6 2.1-4.7 4.8-4.7s4.8 2.1 4.8 4.7v3.2H29v-3.2C29 13.5 25.4 10 24 10z" fill="#e8c98a" />
      <rect x="13" y="21" width="22" height="16" rx="4" fill="#d4af70" />
      <circle cx="24" cy="28" r="2.4" fill="#16110a" />
      <path d="M24 30.2v4.2" stroke="#16110a" strokeWidth="2.2" strokeLinecap="round" />
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
