import { NextResponse } from 'next/server';

import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { hasTmdbKey } from '@/lib/api/_client';
import { getWatchProviders } from '@/lib/api/providers';
import { getTrending } from '@/lib/api/search';
import type { Content } from '@/lib/types';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<unknown>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(60, 60 * 1000);

const querySchema = z.object({
  // hard limit to keep the endpoint stable (and cheap)
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

function hasAnyProvidersKr(wp: Awaited<ReturnType<typeof getWatchProviders>>): boolean {
  const kr = wp.results['KR'];
  if (!kr) return false;
  const n =
    (kr.flatrate?.length ?? 0) +
    (kr.free?.length ?? 0) +
    (kr.rent?.length ?? 0) +
    (kr.buy?.length ?? 0);
  return n > 0;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]!, idx);
    }
  });

  await Promise.all(workers);
  return out;
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
  const parsed = querySchema.safeParse({ limit: url.searchParams.get('limit') ?? undefined });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const limit = parsed.data.limit ?? 10;
  const cacheKey = `home:v1:ko-KR:limit=${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ ...(cached as object), fromCache: true });

  if (!hasTmdbKey() || process.env.USE_MOCK === '1') {
    const mock = { ottMovies: [], theaterMovies: [], krTv: [], globalTv: [], fromCache: false };
    cache.set(cacheKey, mock);
    return NextResponse.json(mock);
  }

  try {
    const [movieBase, tvBase] = await Promise.all([
      getTrending({ media_type: 'movie', time_window: 'day', language: 'ko-KR', limit: 30 }),
      getTrending({ media_type: 'tv', time_window: 'day', language: 'ko-KR', limit: 30 }),
    ]);

    const tvIsDomestic = (c: Content): boolean => {
      const countries = c.origin_country ?? [];
      if (countries.includes('KR')) return true;
      return c.original_language === 'ko';
    };

    const krTv: Content[] = [];
    const globalTv: Content[] = [];
    for (const c of tvBase) {
      if (tvIsDomestic(c)) krTv.push(c);
      else globalTv.push(c);
    }

    const hasKr = await mapWithConcurrency(movieBase, 5, async (m) => {
      const wp = await getWatchProviders({ media_type: 'movie', id: m.id });
      return hasAnyProvidersKr(wp);
    });

    const ottMovies: Content[] = [];
    const theaterMovies: Content[] = [];
    for (let idx = 0; idx < movieBase.length; idx++) {
      const m = movieBase[idx]!;
      if (hasKr[idx]) ottMovies.push(m);
      else theaterMovies.push(m);
    }

    const payload = {
      ottMovies: ottMovies.slice(0, limit),
      theaterMovies: theaterMovies.slice(0, limit),
      krTv: krTv.slice(0, limit),
      globalTv: globalTv.slice(0, limit),
      fromCache: false,
    };

    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

