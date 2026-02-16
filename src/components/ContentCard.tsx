import Image from 'next/image';
import Link from 'next/link';

import type { Content } from '@/lib/types';
import { posterUrlFromPath, yearFromDate } from '@/lib/image-url';

function mediaTypeLabel(mt: Content['media_type']): string {
  return mt === 'movie' ? '영화' : '드라마';
}

export function ContentCard({ item }: { item: Content }) {
  const href = item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
  const posterUrl = posterUrlFromPath(item.poster_path, 'w342') ?? '/poster-placeholder.svg';
  const year = yearFromDate(item.media_type === 'movie' ? item.release_date : item.first_air_date);
  const overview = item.overview.trim() ? item.overview.trim() : '줄거리 정보 없음';

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/20">
        <Image
          src={posterUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover opacity-95 transition group-hover:opacity-100"
        />
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
          {mediaTypeLabel(item.media_type)}
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {item.title}
            {year ? <span className="text-white/45">{` (${year})`}</span> : null}
          </div>
        </div>
        <div className="max-h-[72px] overflow-hidden text-xs leading-5 text-white/65">{overview}</div>
      </div>
    </Link>
  );
}
