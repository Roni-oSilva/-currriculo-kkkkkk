export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-[28px] bg-paper/80" style={{ animationDelay: `${i * 120}ms` }} />)}
    </main>
  );
}
