import Link from "next/link";

export default function BuildsIndex() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <p className="text-xs uppercase tracking-widest text-accent">Builds</p>
      <h1 className="text-3xl font-semibold tracking-tight">Side builds</h1>
      <p className="text-sm text-muted">These pages sit next to the member site. They do not replace the board.</p>
      <Link href="/builds/props-desk" className="card block p-4">
        <span className="block font-semibold">Falcons–Saints props desk</span>
        <span className="mt-1 block text-sm text-muted">Game log, line, target share, and defense vs position. ESPN numbers only.</span>
      </Link>
    </main>
  );
}
