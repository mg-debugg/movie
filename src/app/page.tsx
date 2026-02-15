'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { MovieProvidersResponse, ProviderView, RegionProviders } from '@/lib/types';

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

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="h-28 w-20 animate-pulse rounded-xl bg-black/10" />
        <div className="flex-1">
          <div className="h-5 w-2/3 animate-pulse rounded bg-black/10" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-black/10" />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-black/10" />
            <div className="h-8 w-28 animate-pulse rounded-full bg-black/10" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-black/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderPill({ p }: { p: ProviderView }) {
  const inner = (
    <>
      {p.logoUrl ? (
        <span className="relative h-5 w-5 overflow-hidden rounded">
          <Image src={p.logoUrl} alt={p.name} fill className="object-cover" />
        </span>
      ) : (
        <span className="h-5 w-5 rounded bg-black/10" />
      )}
      <span className="max-w-[12rem] truncate font-medium">{p.name}</span>
    </>
  );

  return p.link ? (
    <a
      href={p.link}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-black shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow"
    >
      {inner}
    </a>
  ) : (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-black shadow-sm">
      {inner}
    </div>
  );
}

function ProvidersRow({ providers }: { providers: ProviderView[] }) {
  if (providers.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {providers.map((p) => (
        <ProviderPill key={p.key} p={p} />
      ))}
    </div>
  );
}

function PaidSection({ region }: { region: RegionProviders }) {
  if (!region.showPaid) return null;

  const hasPaid = region.paidProviders.rent.length > 0 || region.paidProviders.buy.length > 0;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-3 text-sm text-black/70">
        추가 결제 없이 볼 수 있는 제공처가 없습니다.
      </div>

      {hasPaid ? (
        <div className="space-y-3">
          {region.paidProviders.rent.length ? (
            <div>
              <div className="text-sm font-semibold text-black/70">대여</div>
              <ProvidersRow providers={region.paidProviders.rent} />
            </div>
          ) : null}
          {region.paidProviders.buy.length ? (
            <div>
              <div className="text-sm font-semibold text-black/70">구매</div>
              <ProvidersRow providers={region.paidProviders.buy} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-3 text-sm text-black/70">
          현재 제공처 정보가 없습니다.
        </div>
      )}
    </div>
  );
}

function MovieCard({ data }: { data: MovieProvidersResponse }) {
  const movieTitle = useMemo(() => {
    const y = data.movie.year ? ` (${data.movie.year})` : '';
    return `${data.movie.title}${y}`;
  }, [data.movie.title, data.movie.year]);

  const region = data.kr;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
          {data.movie.posterUrl ? (
            <Image src={data.movie.posterUrl} alt={data.movie.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-black/40">No poster</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="truncate text-lg font-semibold text-black">{movieTitle}</h2>
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/70">KR 기준</span>
          </div>

          {region.message ? (
            <div className="mt-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-3 text-sm text-black/70">
              {region.message}
            </div>
          ) : null}

          {region.exists ? (
            <>
              <ProvidersRow providers={region.primaryProviders} />
              <PaidSection region={region} />
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-3 text-sm text-black/70">
              한국(KR) 제공처 데이터를 찾지 못했습니다.
            </div>
          )}

          {data.usedMock ? (
            <div className="mt-4 text-xs text-black/50">TMDB API 키가 없어 mock 데이터로 표시 중입니다.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FallbackPanel({ fallback }: { fallback: RegionProviders }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 bg-gradient-to-r from-amber-50 to-white px-4 py-2 text-sm font-semibold text-black/70">
        대체 결과 ({fallback.country})
      </div>
      <div className="p-4">
        <ProvidersRow providers={fallback.primaryProviders} />
        <PaidSection region={fallback} />
        {fallback.primaryProviders.length === 0 && !fallback.showPaid ? (
          <div className="mt-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-3 text-sm text-black/70">
            현재 제공처 정보가 없습니다.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<MovieProvidersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const suggestAbort = useRef<AbortController | null>(null);

  const [showFallback, setShowFallback] = useState(false);

  async function runSearch(opts: { query?: string; id?: number }) {
    setError(null);
    setOpenSuggest(false);
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
      setOpenSuggest(false);
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
        setOpenSuggest(true);
      } catch {
        // ignore
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [query]);

  const showFallbackToggle = Boolean(data?.fallback) && data?.kr.exists === false;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-14 sm:px-6">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-black/70 backdrop-blur">
            KR 우선 표시, 없으면 대체 결과 제공
          </div>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            영화 OTT 제공처 검색
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/60">영화 제목을 입력하면 KR 기준 제공처를 보여줍니다.</p>
        </header>

        <form
          className="relative mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch({ query });
          }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length) setOpenSuggest(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setOpenSuggest(false), 150);
                }}
                placeholder="예: 기생충, 듄: 파트 2, 범죄도시 4"
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-black shadow-sm outline-none transition focus:border-black/25 focus:shadow"
              />
              {openSuggest && suggestions.length ? (
                <div className="absolute left-0 right-0 top-[3.25rem] z-10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-black/[0.03]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQuery(s.title);
                        void runSearch({ id: s.id, query: s.title });
                      }}
                    >
                      <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-black/5">
                        {s.posterUrl ? (
                          <Image src={s.posterUrl} alt={s.title} fill className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-black">
                          {s.title}
                          {s.year ? <span className="text-black/50">{` (${s.year})`}</span> : null}
                        </span>
                      </span>
                      <span className="text-xs text-black/40">선택</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="h-12 shrink-0 rounded-2xl bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? '검색 중…' : '검색'}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-black/50">
            <span>Enter로 검색, 입력 중 자동완성(최대 5개)</span>
            <span>{data?.fromCache ? '서버 캐시 hit' : null}</span>
          </div>
        </form>

        <main className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
              <div className="mt-1 text-xs text-red-800/70">
                네트워크/서버 오류라면 잠시 후 다시 시도하거나 API 키 설정을 확인하세요.
              </div>
            </div>
          ) : null}

          {busy ? <SkeletonCard /> : null}

          {!busy && data ? <MovieCard data={data} /> : null}

          {!busy && data && showFallbackToggle ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowFallback((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:border-black/20"
              >
                {showFallback ? '대체 결과 숨기기' : '대체 결과 보기'}
              </button>
              {showFallback && data.fallback ? <FallbackPanel fallback={data.fallback} /> : null}
            </div>
          ) : null}
        </main>

        <footer className="mt-14 text-xs text-black/50">
          데이터: TMDB Watch Providers. API 키는 서버(API Route)에서만 사용합니다.
        </footer>
      </div>
    </div>
  );
}

