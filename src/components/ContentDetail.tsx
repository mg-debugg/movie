'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Content, ProviderView, RegionProviders } from '@/lib/types';
import { posterUrlFromPath, yearFromDate } from '@/lib/image-url';

type DetailResponse = {
  content: Content;
  year?: number;
  posterUrl?: string;
  providers: { kr: RegionProviders; fallback?: RegionProviders };
  fromCache: boolean;
};

type OttFilter = 'all' | 'netflix' | 'disney' | 'tving' | 'wavve' | 'coupangplay';

function mediaTypeLabel(mt: Content['media_type']): string {
  return mt === 'movie' ? '영화' : '드라마';
}

function ottLabel(key: OttFilter): string {
  if (key === 'all') return '전체';
  if (key === 'netflix') return '넷플릭스';
  if (key === 'disney') return '디즈니+';
  if (key === 'tving') return '티빙';
  if (key === 'wavve') return '웨이브';
  return '쿠팡플레이';
}

function pickProvidersForUi(all: ProviderView[]): ProviderView[] {
  const allow = new Set(['netflix', 'disney', 'tving', 'wavve', 'coupangplay']);
  return all.filter((p) => allow.has(p.key));
}

function applyOttFilter(arr: ProviderView[], filter: OttFilter): ProviderView[] {
  if (filter === 'all') return arr;
  return arr.filter((p) => p.key === filter);
}

export function ContentDetail({ media_type, id }: { media_type: 'movie' | 'tv'; id: number }) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ott, setOtt] = useState<OttFilter>('all');

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    (async () => {
      setBusy(true);
      setError(null);
      try {
        const u = new URL('/api/detail', window.location.origin);
        u.searchParams.set('type', media_type);
        u.searchParams.set('id', String(id));
        const res = await fetch(u.toString(), { signal: ac.signal });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message || '상세 정보를 불러오지 못했습니다.');
        }
        const json = (await res.json()) as DetailResponse;
        if (alive) setData(json);
      } catch (e) {
        if (!alive) return;
        if (e instanceof Error) setError(e.message);
        else setError('네트워크 오류가 발생했습니다.');
      } finally {
        if (alive) setBusy(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [id, media_type]);

  const title = data?.content.title ?? '';
  const year = data?.year ?? yearFromDate(media_type === 'movie' ? data?.content.release_date : data?.content.first_air_date);
  const posterUrl = data?.posterUrl ?? posterUrlFromPath(data?.content.poster_path, 'w342') ?? '/poster-placeholder.svg';
  const overview = data?.content.overview?.trim() ? data.content.overview.trim() : '줄거리 정보 없음';

  const krProviders = useMemo(() => {
    const all = data?.providers.kr.primaryProviders ?? [];
    return pickProvidersForUi(all);
  }, [data]);

  const shownProviders = useMemo(() => applyOttFilter(krProviders, ott), [krProviders, ott]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(244,63,94,0.25),transparent_55%),radial-gradient(900px_500px_at_90%_0%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_500px_at_50%_120%,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,15,0.2),rgba(11,11,15,1))]" />
      </div>

      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0f]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
          >
            <span className="text-white/60">{'<'} </span>
            홈
          </Link>
          <div className="min-w-0 flex-1 truncate text-sm text-white/70">
            {mediaTypeLabel(media_type)} 상세
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {error ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {busy ? <div className="h-[260px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" /> : null}

        {!busy && data ? (
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-0">
                <Image src={posterUrl} alt={title} fill className="object-cover opacity-25 blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/75 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </div>

              <div className="relative grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:gap-8 sm:p-8">
                <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm sm:mx-0 sm:w-full">
                  <Image src={posterUrl} alt={title} fill className="object-cover" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">한국(KR)</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {mediaTypeLabel(data.content.media_type)}
                    </span>
                  </div>

                  <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {title}
                    {year ? <span className="text-white/45">{` (${year})`}</span> : null}
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-white/70">{overview}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white/85">OTT 제공처</h2>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'netflix', 'disney', 'tving', 'wavve', 'coupangplay'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setOtt(k)}
                      className={
                        k === ott
                          ? 'rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100'
                          : 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/75 hover:bg-white/[0.06]'
                      }
                    >
                      {ottLabel(k)}
                    </button>
                  ))}
                </div>
              </div>

              {shownProviders.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {shownProviders.map((p) => (
                    <a
                      key={p.key}
                      href={p.link ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!p.link}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                    >
                      <span className="relative h-8 w-8 overflow-hidden rounded bg-white/10">
                        {p.logoUrl ? <Image src={p.logoUrl} alt={p.name} fill className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white/90">{p.name}</span>
                        <span className="block truncate text-xs text-white/55">바로가기</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/70">
                  주요 OTT 제공처 정보가 없습니다.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
