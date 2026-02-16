'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ContentCard } from '@/components/ContentCard';
import { Header, type Suggestion } from '@/components/Header';
import type { Content } from '@/lib/types';

type SearchResponse = { query: string; results: Content[] };
type HomeResponse = {
  ottMovies: Content[];
  theaterMovies: Content[];
  krTv: Content[];
  globalTv: Content[];
};

function typeLabel(t: 'all' | 'movie' | 'tv'): string {
  if (t === 'all') return '전체';
  return t === 'movie' ? '영화' : '드라마';
}

export default function Home() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<Content[] | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const suggestAbort = useRef<AbortController | null>(null);

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const [ottMovies, setOttMovies] = useState<Content[] | null>(null);
  const [krTv, setKrTv] = useState<Content[] | null>(null);
  const [globalTv, setGlobalTv] = useState<Content[] | null>(null);
  const [theaterMovies, setTheaterMovies] = useState<Content[] | null>(null);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    setLastQuery(trimmed);
    setResults(null);

    try {
      const u = new URL('/api/search', window.location.origin);
      u.searchParams.set('query', trimmed);
      const res = await fetch(u.toString());
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        if (body?.error === 'RATE_LIMITED') throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        throw new Error(body?.message || '검색 중 오류가 발생했습니다.');
      }
      const json = (await res.json()) as SearchResponse;
      setResults(json.results);
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
    }, 250);

    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(new URL('/api/home', window.location.origin).toString(), { signal: ac.signal });
        if (!alive) return;
        if (!res.ok) return;
        const json = (await res.json()) as HomeResponse;
        setOttMovies(json.ottMovies);
        setKrTv(json.krTv);
        setGlobalTv(json.globalTv);
        setTheaterMovies(json.theaterMovies);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, []);

  const filteredResults = useMemo(() => {
    const arr = results ?? [];
    if (typeFilter === 'all') return arr;
    return arr.filter((x) => x.media_type === typeFilter);
  }, [results, typeFilter]);

  const showSearch = results !== null || busy || error || lastQuery !== null;
  const showTrending = !showSearch;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(244,63,94,0.25),transparent_55%),radial-gradient(900px_500px_at_90%_0%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_500px_at_50%_120%,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,15,0.2),rgba(11,11,15,1))]" />
      </div>

      <Header
        query={query}
        busy={busy}
        suggestions={suggestions}
        onQueryChange={(v) => setQuery(v)}
        onSubmit={() => void runSearch(query)}
        onPickSuggestion={(s) => {
          router.push(s.media_type === 'movie' ? `/movie/${s.id}` : `/tv/${s.id}`);
        }}
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            보고 싶은 작품, <br className="md:hidden" />
            어느 OTT에 있는지 궁금하다면?
          </h1>
          
        </div>

        {error ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {busy ? <div className="h-[260px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" /> : null}

        {showTrending ? (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/85">OTT 영화</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {(ottMovies ?? []).map((c) => (
                  <ContentCard key={`movie:${c.id}`} item={c} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/85">국내 드라마/예능</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {(krTv ?? []).map((c) => (
                  <ContentCard key={`tv:${c.id}`} item={c} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/85">전체 드라마/예능</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {(globalTv ?? []).map((c) => (
                  <ContentCard key={`tv:global:${c.id}`} item={c} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/85">극장 영화</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {(theaterMovies ?? []).map((c) => (
                  <ContentCard key={`movie:theater:${c.id}`} item={c} />
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {!busy && results !== null ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white/85">
                검색 결과{lastQuery ? <span className="text-white/50">{`: "${lastQuery}"`}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'movie', 'tv'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={
                      t === typeFilter
                        ? 'rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100'
                        : 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75 hover:bg-white/[0.06]'
                    }
                  >
                    {typeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {filteredResults.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {filteredResults.map((c) => (
                  <ContentCard key={`${c.media_type}:${c.id}`} item={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/70">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
