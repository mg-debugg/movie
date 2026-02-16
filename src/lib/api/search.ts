import { z } from 'zod';

import type { Content } from '@/lib/types';

import { tmdbGet, tmdbUrl } from './_client';

const tmdbMultiSearchResultSchema = z
  .object({
    id: z.number(),
    media_type: z.string(),
    popularity: z.number().optional().nullable(),

    // movie fields
    title: z.string().optional().nullable(),
    release_date: z.string().optional().nullable(),

    // tv fields
    name: z.string().optional().nullable(),
    first_air_date: z.string().optional().nullable(),

    poster_path: z.string().optional().nullable(),
    overview: z.string().optional().nullable(),
  })
  .passthrough();

const tmdbMultiSearchSchema = z.object({
  results: z.array(tmdbMultiSearchResultSchema),
});

function toContent(row: z.infer<typeof tmdbMultiSearchResultSchema>): Content | null {
  if (row.media_type !== 'movie' && row.media_type !== 'tv') return null;

  const title = row.media_type === 'movie' ? (row.title ?? '') : (row.name ?? '');
  if (!title.trim()) return null;

  return {
    id: row.id,
    title,
    media_type: row.media_type,
    poster_path: row.poster_path ?? '',
    overview: row.overview ?? '',
    release_date: row.release_date ?? undefined,
    first_air_date: row.first_air_date ?? undefined,
  };
}

export async function searchMulti(opts: {
  query: string;
  language: string;
  page?: number;
}): Promise<Content[]> {
  const u = new URL(tmdbUrl('/search/multi'));
  u.searchParams.set('query', opts.query);
  u.searchParams.set('language', opts.language);
  u.searchParams.set('include_adult', 'false');
  u.searchParams.set('page', String(opts.page ?? 1));

  const data = await tmdbGet(u.toString(), tmdbMultiSearchSchema);

  // Sort by popularity desc (requirement), then map/filter media_type.
  return data.results
    .slice()
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .map(toContent)
    .filter((x): x is Content => Boolean(x));
}

const tmdbTrendingSchema = z.object({
  results: z.array(
    z
      .object({
        id: z.number(),
        popularity: z.number().optional().nullable(),
        poster_path: z.string().optional().nullable(),
        overview: z.string().optional().nullable(),

        // movie
        title: z.string().optional().nullable(),
        release_date: z.string().optional().nullable(),

        // tv
        name: z.string().optional().nullable(),
        first_air_date: z.string().optional().nullable(),

        // tv (optional fields in some endpoints like trending)
        origin_country: z.array(z.string()).optional().nullable(),
        original_language: z.string().optional().nullable(),
      })
      .passthrough(),
  ),
});

export async function getTrending(opts: {
  media_type: 'movie' | 'tv';
  time_window?: 'day' | 'week';
  language: string;
  limit?: number;
}): Promise<Content[]> {
  const u = new URL(tmdbUrl(`/trending/${opts.media_type}/${opts.time_window ?? 'day'}`));
  u.searchParams.set('language', opts.language);

  const data = await tmdbGet(u.toString(), tmdbTrendingSchema);
  const mt = opts.media_type;
  const limit = Math.max(1, opts.limit ?? 10);

  return data.results
    .slice()
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .map((row) => {
      const title = mt === 'movie' ? (row.title ?? '') : (row.name ?? '');
      return {
        id: row.id,
        title: title.trim() ? title : '(제목 없음)',
        media_type: mt,
        poster_path: row.poster_path ?? '',
        overview: row.overview ?? '',
        release_date: mt === 'movie' ? (row.release_date ?? undefined) : undefined,
        first_air_date: mt === 'tv' ? (row.first_air_date ?? undefined) : undefined,
        origin_country: mt === 'tv' ? (row.origin_country ?? undefined) : undefined,
        original_language: mt === 'tv' ? (row.original_language ?? undefined) : undefined,
      } satisfies Content;
    })
    .slice(0, limit);
}
