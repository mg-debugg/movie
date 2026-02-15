import type { ProviderView } from '@/lib/types';

import { MovieCard } from './MovieCard';

export type MovieGridSection = {
  title?: string;
  badge?: 'rent' | 'buy';
  providers: ProviderView[];
};

export function MovieGrid({
  posterUrl,
  movieTitle,
  sections,
}: {
  posterUrl?: string;
  movieTitle: string;
  sections: MovieGridSection[];
}) {
  const nonEmpty = sections.filter((s) => s.providers.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-6">
      {nonEmpty.map((s, idx) => (
        <section key={`${s.title ?? 'section'}:${idx}`}>
          {s.title ? <h3 className="mb-3 text-sm font-semibold text-white/80">{s.title}</h3> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {s.providers.map((p) => (
              <MovieCard
                key={`${s.badge ?? 'primary'}:${p.key}`}
                posterUrl={posterUrl}
                movieTitle={movieTitle}
                provider={p}
                badge={s.badge}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

