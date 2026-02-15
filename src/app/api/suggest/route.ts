import { NextResponse } from 'next/server';
import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { hasTmdbKey, releaseYear, searchMovies, tmdbPosterUrl } from '@/lib/tmdb';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<unknown>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(30, 60 * 1000);

const querySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

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
  const parsed = querySchema.safeParse({ query: url.searchParams.get('query') ?? '' });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const q = parsed.data.query;
  const cacheKey = `suggest:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!hasTmdbKey() || process.env.USE_MOCK === '1') {
    const mock = [
      { id: 496243, title: '기생충', year: 2019, posterUrl: undefined },
      { id: 11216, title: '올드보이', year: 2003, posterUrl: undefined },
      { id: 372058, title: '너의 이름은.', year: 2016, posterUrl: undefined },
    ].filter((m) => m.title.includes(q));
    cache.set(cacheKey, mock.slice(0, 5));
    return NextResponse.json(mock.slice(0, 5));
  }

  try {
    const krResults = await searchMovies({ query: q, language: 'ko-KR', region: 'KR' });
    const results = krResults.length ? krResults : await searchMovies({ query: q, language: 'en-US', region: 'US' });

    const top5 = results.slice(0, 5).map((m) => ({
      id: m.id,
      title: m.title,
      year: releaseYear(m.release_date),
      posterUrl: tmdbPosterUrl(m.poster_path, 'w185'),
    }));

    cache.set(cacheKey, top5);
    return NextResponse.json(top5);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

