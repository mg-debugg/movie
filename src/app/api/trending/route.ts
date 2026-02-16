import { NextResponse } from 'next/server';
import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { hasTmdbKey } from '@/lib/api/_client';
import { getTrending } from '@/lib/api/search';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<unknown>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(120, 60 * 1000);

const querySchema = z.object({
  type: z.enum(['movie', 'tv']),
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
  const parsed = querySchema.safeParse({ type: url.searchParams.get('type') ?? '' });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const type = parsed.data.type;
  const cacheKey = `trending:day:${type}:ko-KR`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!hasTmdbKey() || process.env.USE_MOCK === '1') {
    const mock = { type, results: [] };
    cache.set(cacheKey, mock);
    return NextResponse.json(mock);
  }

  try {
    const results = await getTrending({ media_type: type, time_window: 'day', language: 'ko-KR' });
    const payload = { type, results };
    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

