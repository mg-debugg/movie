import Image from 'next/image';

import type { ProviderView } from '@/lib/types';

export function MovieCard({
  posterUrl,
  movieTitle,
  provider,
  badge,
}: {
  posterUrl?: string;
  movieTitle: string;
  provider: ProviderView;
  badge?: 'rent' | 'buy';
}) {
  const badgeLabel = badge === 'rent' ? '대여' : badge === 'buy' ? '구매' : undefined;

  return (
    <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-sm transition will-change-transform hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] focus-within:scale-[1.02]">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={movieTitle}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover opacity-90 transition group-hover:opacity-100"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 opacity-90" />

      {badgeLabel ? (
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
          {badgeLabel}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center gap-2">
          {provider.logoUrl ? (
            <span className="relative h-6 w-6 overflow-hidden rounded">
              <Image src={provider.logoUrl} alt={provider.name} fill className="object-cover" />
            </span>
          ) : (
            <span className="h-6 w-6 rounded bg-white/10" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{provider.name}</div>
            <div className="truncate text-xs text-white/65">{movieTitle}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <a
            href={provider.link ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
            aria-disabled={!provider.link}
          >
            OTT에서 보기
          </a>
        </div>
      </div>
    </div>
  );
}

