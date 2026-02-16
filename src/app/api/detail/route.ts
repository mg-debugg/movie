import { NextResponse } from 'next/server';
import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { hasTmdbKey, releaseYear, tmdbPosterUrl } from '@/lib/api/_client';
import { getContentDetail } from '@/lib/api/detail';
import { getProvidersForKorea } from '@/lib/api/providers';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<unknown>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(60, 60 * 1000);

const querySchema = z.object({
  type: z.enum(['movie', 'tv']),
  id: z.coerce.number().int().positive(),
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
  const parsed = querySchema.safeParse({
    type: url.searchParams.get('type') ?? '',
    id: url.searchParams.get('id') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const { type, id } = parsed.data;
  const cacheKey = `detail:v1:${type}:${id}:ko-KR`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ ...(cached as object), fromCache: true });

  if (!hasTmdbKey() || process.env.USE_MOCK === '1') {
    return NextResponse.json({ error: 'NO_TMDB_KEY', message: 'TMDB API Key is missing.' }, { status: 503 });
  }

  try {
    const [content, providers] = await Promise.all([
      getContentDetail({ media_type: type, id, language: 'ko-KR' }),
      getProvidersForKorea({ media_type: type, id }),
    ]);

    const year = releaseYear(type === 'movie' ? content.release_date ?? null : content.first_air_date ?? null);
    const posterUrl = tmdbPosterUrl(content.poster_path);

    const payload = {
      content,
      year,
      posterUrl,
      providers,
      fromCache: false,
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

