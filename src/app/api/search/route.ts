import { NextResponse } from 'next/server';
import { z } from 'zod';

import { FixedWindowRateLimiter, TtlCache } from '@/lib/cache';
import { hasTmdbKey } from '@/lib/api/_client';
import { searchMulti } from '@/lib/api/search';

import { getClientIp } from '../_shared';

const TEN_MIN_MS = 10 * 60 * 1000;
const cache = new TtlCache<unknown>(TEN_MIN_MS);
const limiter = new FixedWindowRateLimiter(60, 60 * 1000);

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
  const cacheKey = `search:v1:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!hasTmdbKey() || process.env.USE_MOCK === '1') {
    const mock = { query: q, results: [] };
    cache.set(cacheKey, mock);
    return NextResponse.json(mock);
  }

  try {
    const ko = await searchMulti({ query: q, language: 'ko-KR' });
    const results = ko.length ? ko : await searchMulti({ query: q, language: 'en-US' });
    const payload = { query: q, results };
    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'API_ERROR', message: msg }, { status: 502 });
  }
}

