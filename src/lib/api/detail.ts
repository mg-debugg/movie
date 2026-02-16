import { z } from 'zod';

import type { Content } from '@/lib/types';

import { tmdbGet, tmdbUrl } from './_client';

const tmdbMovieDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().optional().nullable(),
  overview: z.string().optional().nullable(),
  release_date: z.string().optional().nullable(),
});

const tmdbTvDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_path: z.string().optional().nullable(),
  overview: z.string().optional().nullable(),
  first_air_date: z.string().optional().nullable(),
});

export async function getContentDetail(opts: {
  media_type: 'movie' | 'tv';
  id: number;
  language: string;
}): Promise<Content> {
  const u = new URL(tmdbUrl(`/${opts.media_type}/${opts.id}`));
  u.searchParams.set('language', opts.language);

  if (opts.media_type === 'movie') {
    const data = await tmdbGet(u.toString(), tmdbMovieDetailSchema);
    return {
      id: data.id,
      title: data.title,
      media_type: 'movie',
      poster_path: data.poster_path ?? '',
      overview: data.overview ?? '',
      release_date: data.release_date ?? undefined,
    };
  }

  const data = await tmdbGet(u.toString(), tmdbTvDetailSchema);
  return {
    id: data.id,
    title: data.name,
    media_type: 'tv',
    poster_path: data.poster_path ?? '',
    overview: data.overview ?? '',
    first_air_date: data.first_air_date ?? undefined,
  };
}
