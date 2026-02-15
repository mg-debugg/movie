import { NextResponse } from 'next/server';
import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { getMockProviders } from '@/lib/mock';
import { buildRegionProviders } from '@/lib/provider-transform';
import type { MovieProvidersResponse } from '@/lib/types';
import {
  getMovie,
  getWatchProviders,
  hasTmdbKey,
  releaseYear,
  searchMovies,
  tmdbPosterUrl,
} from '@/lib/tmdb';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<MovieProvidersResponse>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(30, 60 * 1000);

const querySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  id: z.coerce.number().int().positive().optional(),
});

async function handleTmdb(params: { query?: string; id?: number }): Promise<MovieProvidersResponse> {
  const usedMock = !hasTmdbKey() || process.env.USE_MOCK === '1';
  if (usedMock) return getMockProviders(params.query ?? String(params.id ?? ''));

  // Resolve movie id
  let movieId = params.id;
  const query = params.query?.trim();
  if (!movieId) {
    if (!query) throw new Error('query is required when id is not provided');
    const krResults = await searchMovies({ query, language: 'ko-KR', region: 'KR' });
    const fallbackResults = krResults.length
      ? krResults
      : await searchMovies({ query, language: 'en-US', region: 'US' });
    const top = fallbackResults[0];
    if (!top) {
      return {
        query,
        movie: { id: 0, title: query },
        kr: {
          country: 'KR',
          exists: true,
          message: '검색 결과가 없습니다.',
          primaryProviders: [],
          paidProviders: { rent: [], buy: [] },
          showPaid: false,
        },
        usedMock: false,
        fromCache: false,
      };
    }
    movieId = top.id;
  }

  const [movieKo, providers] = await Promise.all([getMovie(movieId, 'ko-KR'), getWatchProviders(movieId)]);
  const movie = {
    id: movieKo.id,
    title: movieKo.title,
    year: releaseYear(movieKo.release_date),
    posterUrl: tmdbPosterUrl(movieKo.poster_path),
  };

  const krEntry = providers.results['KR'];
  const usEntry = providers.results['US'];

  // Data extraction rules:
  // 1) Prefer KR. If KR exists, use KR only.
  // 2) If KR missing, return KR 없음 상태 + optional folded fallback (US).
  const kr = buildRegionProviders('KR', krEntry);
  const fallback = !krEntry && usEntry ? buildRegionProviders('US', usEntry) : undefined;

  return {
    query,
    movie,
    kr,
    fallback,
    usedMock: false,
    fromCache: false,
  };
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = limiter.check(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: `Too many requests. Try again in ~${rl.retryAfterSec}s.` },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSec) } },
    );
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    query: url.searchParams.get('query') ?? undefined,
    id: url.searchParams.get('id') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const { query, id } = parsed.data;
  const cacheKey = id ? `movie:id:${id}` : `movie:query:${(query ?? '').toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ ...cached, fromCache: true } satisfies MovieProvidersResponse);

  try {
    const data = await handleTmdb({ query, id });

    if (!data.usedMock && data.movie.id === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'No results found for that title.' }, { status: 404 });
    }

    cache.set(cacheKey, data);
    return NextResponse.json(data satisfies MovieProvidersResponse);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

