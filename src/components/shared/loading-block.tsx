export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" data-el="loading-block" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="fg-glass h-16 animate-pulse rounded-2xl opacity-60" />
      ))}
    </div>
  );
}
