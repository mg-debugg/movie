'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { HeroResult } from '@/components/HeroResult';
import { MovieGrid } from '@/components/MovieGrid';
import { SkeletonCard } from '@/components/SkeletonCard';
import type { MovieProvidersResponse } from '@/lib/types';

type Suggestion = { id: number; title: string; year?: number; posterUrl?: string };

const LOCAL_TTL_MS = 10 * 60 * 1000;

function localCacheKey(query: string): string {
  return `movieott:v2:${query.trim().toLowerCase()}`;
}

function tryReadLocalCache(query: string): MovieProvidersResponse | null {
  try {
    const raw = localStorage.getItem(localCacheKey(query));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: MovieProvidersResponse };
    if (!parsed?.at || !parsed?.data) return null;
    if (Date.now() - parsed.at > LOCAL_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(query: string, data: MovieProvidersResponse): void {
  try {
    localStorage.setItem(localCacheKey(query), JSON.stringify({ at: Date.now(), data }));
  } catch {
    // ignore
  }
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<MovieProvidersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const suggestAbort = useRef<AbortController | null>(null);

  const [showFallback, setShowFallback] = useState(false);

  async function runSearch(opts: { query?: string; id?: number }) {
    setError(null);
    setShowFallback(false);

    const displayQuery = opts.query ?? query;
    if (!opts.id && !displayQuery.trim()) return;

    if (displayQuery && !opts.id) {
      const cached = tryReadLocalCache(displayQuery);
      if (cached) {
        setData(cached);
        return;
      }
    }

    setBusy(true);
    try {
      const u = new URL('/api/movie', window.location.origin);
      if (opts.id) u.searchParams.set('id', String(opts.id));
      else u.searchParams.set('query', displayQuery);

      const res = await fetch(u.toString());
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        if (res.status === 404) throw new Error('검색 결과가 없습니다.');
        if (body?.error === 'RATE_LIMITED') throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        throw new Error(body?.message || 'API 오류가 발생했습니다.');
      }
      const json = (await res.json()) as MovieProvidersResponse;
      setData(json);
      if (displayQuery && !opts.id) writeLocalCache(displayQuery, json);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const t = window.setTimeout(async () => {
      suggestAbort.current?.abort();
      const ac = new AbortController();
      suggestAbort.current = ac;

      try {
        const u = new URL('/api/suggest', window.location.origin);
        u.searchParams.set('query', q);
        const res = await fetch(u.toString(), { signal: ac.signal });
        if (!res.ok) return;
        const json = (await res.json()) as Suggestion[];
        setSuggestions(json);
      } catch {
        // ignore
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [query]);

  const heroTitle = useMemo(() => {
    if (!data) return '';
    return `${data.movie.title}${data.movie.year ? ` (${data.movie.year})` : ''}`;
  }, [data]);

  const hasAnyProvider = useMemo(() => {
    if (!data) return false;
    const kr = data.kr;
    const paidCount = kr.paidProviders.rent.length + kr.paidProviders.buy.length;
    return kr.primaryProviders.length + paidCount > 0;
  }, [data]);

  const showEmpty =
    data?.kr.exists === true &&
    data.kr.primaryProviders.length === 0 &&
    data.kr.showPaid === true &&
    data.kr.paidProviders.rent.length === 0 &&
    data.kr.paidProviders.buy.length === 0;

  const showFallbackToggle = Boolean(data?.fallback) && data?.kr.exists === false;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(244,63,94,0.25),transparent_55%),radial-gradient(900px_500px_at_90%_0%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_500px_at_50%_120%,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,15,0.2),rgba(11,11,15,1))]" />
      </div>

      <Header
        siteName="화원시네마"
        query={query}
        busy={busy}
        suggestions={suggestions}
        onQueryChange={(v) => setQuery(v)}
        onSubmit={() => void runSearch({ query })}
        onPickSuggestion={(id, title) => {
          setQuery(title);
          void runSearch({ id, query: title });
        }}
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            지금 한국 주요 OTT에서 바로 볼 수 있는 작품을 찾아보세요.
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            제공처 정보는 데이터 소스에 따라 일부 누락될 수 있어요.
          </p>
        </div>

        {error ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {busy ? (
          <div className="space-y-6">
            <div className="h-[260px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : null}

        {!busy && data ? (
          <div className="space-y-10">
            <HeroResult movie={data.movie} region={data.kr} />

            {showEmpty ? (
              <EmptyState />
            ) : (
              <MovieGrid
                posterUrl={data.movie.posterUrl}
                movieTitle={heroTitle}
                sections={
                  data.kr.primaryProviders.length > 0
                    ? [{ providers: data.kr.primaryProviders }]
                    : [
                        { title: data.kr.paidProviders.rent.length ? '대여' : undefined, badge: 'rent', providers: data.kr.paidProviders.rent },
                        { title: data.kr.paidProviders.buy.length ? '구매' : undefined, badge: 'buy', providers: data.kr.paidProviders.buy },
                      ]
                }
              />
            )}

            {showFallbackToggle ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowFallback((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 shadow-sm hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                >
                  {showFallback ? '대체 결과 숨기기' : '대체 결과 보기'}
                </button>

                {showFallback && data.fallback ? (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-white/75">대체 결과 ({data.fallback.country})</div>
                    <MovieGrid
                      posterUrl={data.movie.posterUrl}
                      movieTitle={heroTitle}
                      sections={
                        data.fallback.primaryProviders.length > 0
                          ? [{ providers: data.fallback.primaryProviders }]
                          : [
                              {
                                title: data.fallback.paidProviders.rent.length ? '대여' : undefined,
                                badge: 'rent',
                                providers: data.fallback.paidProviders.rent,
                              },
                              {
                                title: data.fallback.paidProviders.buy.length ? '구매' : undefined,
                                badge: 'buy',
                                providers: data.fallback.paidProviders.buy,
                              },
                            ]
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {!hasAnyProvider && data.kr.exists ? <EmptyState /> : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
