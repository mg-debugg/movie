export function SkeletonCard() {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-sm">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
      </div>
    </div>
  );
}

